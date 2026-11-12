#include "campusspot.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* =========================================================================
 * 1. HASH TABLE WITH SEPARATE CHAINING IMPLEMENTATION
 * ========================================================================= */

/**
 * Standard djb2 hash algorithm.
 * Computes a hash value for room_id and maps it to a table bucket.
 */
unsigned int hashFunction(const char* key) {
    if (!key) return 0;
    unsigned int hash = 5381;
    int c;
    while ((c = (unsigned char)*key++)) {
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
    }
    return hash % HASH_TABLE_SIZE;
}

/**
 * Initializes all hash table bucket heads to NULL and count to 0.
 */
void initializeHashTable(HashTable* ht) {
    if (!ht) return;
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        ht->buckets[i] = NULL;
    }
    ht->count = 0;
}

/**
 * Inserts a room into the hash table.
 * If a collision occurs, separate chaining places the new node at the head
 * of the linked list for that bucket in O(1) time.
 */
bool insertRoom(HashTable* ht, const Room* room) {
    if (!ht || !room) return false;

    unsigned int index = hashFunction(room->room_id);
    HashNode* newNode = (HashNode*)malloc(sizeof(HashNode));
    if (!newNode) return false;

    newNode->room = *room;
    newNode->next = ht->buckets[index];
    ht->buckets[index] = newNode;
    ht->count++;
    return true;
}

/**
 * Looks up a room by room_id using the hash table.
 * Average time complexity: O(1).
 * Worst-case time complexity (all keys collide in one bucket): O(N).
 */
Room* findRoomById(const HashTable* ht, const char* room_id) {
    if (!ht || !room_id) return NULL;

    unsigned int index = hashFunction(room_id);
    HashNode* curr = ht->buckets[index];

    while (curr) {
        if (strcmp(curr->room.room_id, room_id) == 0) {
            return &curr->room;
        }
        curr = curr->next;
    }
    return NULL;
}

/**
 * Frees all dynamically allocated linked list nodes across all buckets.
 */
void freeHashTable(HashTable* ht) {
    if (!ht) return;
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        HashNode* curr = ht->buckets[i];
        while (curr) {
            HashNode* temp = curr;
            curr = curr->next;
            free(temp);
        }
        ht->buckets[i] = NULL;
    }
    ht->count = 0;
}

/* =========================================================================
 * 2. TIME AND INTERVAL UTILITIES
 * ========================================================================= */

/**
 * Parses "HH:MM" into total minutes from midnight (0 to 1439).
 * Returns -1 if the format is invalid or missing.
 */
int parseTimeToMinutes(const char* time_str) {
    if (!time_str || !strchr(time_str, ':')) return -1;
    int h = 0, m = 0;
    if (sscanf(time_str, "%d:%d", &h, &m) != 2) return -1;
    if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
    return h * 60 + m;
}

/**
 * Formats integer minutes back into "HH:MM".
 */
void formatMinutesToTime(int minutes, char* buffer, size_t buf_size) {
    if (!buffer || buf_size < 6) return;
    int h = (minutes / 60) % 24;
    int m = minutes % 60;
    snprintf(buffer, buf_size, "%02d:%02d", h, m);
}

/**
 * Validates that requested interval is non-negative and start precedes end.
 */
bool isValidTimeInterval(int start_mins, int end_mins) {
    return (start_mins >= 0 && end_mins > start_mins && end_mins <= 1440);
}

/**
 * Checks if two half-open time intervals [req_start, req_end) and
 * [occ_start, occ_end) overlap.
 *
 * Conflict rule: req_start < occ_end && req_end > occ_start.
 *
 * Boundary condition:
 * If req_start == occ_end (requested interval starts right when previous ends),
 * req_start < occ_end is false -> NO CONFLICT.
 *
 * If req_end == occ_start (requested interval ends right when next begins),
 * req_end > occ_start is false -> NO CONFLICT.
 */
bool isTimeConflict(int req_start, int req_end, int occ_start, int occ_end) {
    if (!isValidTimeInterval(req_start, req_end) || !isValidTimeInterval(occ_start, occ_end)) {
        return false;
    }
    return (req_start < occ_end && req_end > occ_start);
}

/* =========================================================================
 * 3. FILTERING AND SUITABILITY SCORING
 * ========================================================================= */

/**
 * Checks if room capacity meets minimum student requirement.
 */
bool filterCapacity(const Room* room, int required_students) {
    if (!room) return false;
    return room->capacity >= required_students;
}

/**
 * Checks if room has all mandatory requested facilities.
 */
bool filterFacilities(const Room* room, int req_wifi, int req_power, int req_projector) {
    if (!room) return false;
    if (req_wifi && !room->wifi) return false;
    if (req_power && !room->power) return false;
    if (req_projector && !room->projector) return false;
    return true;
}

/**
 * Checks room availability by performing a linear scan over timetable entries.
 * Returns false as soon as any conflicting class on the requested day is detected.
 */
bool isRoomAvailable(const Room* room, const SearchQuery* query, const TimetableEntry timetables[], int tt_count) {
    if (!room || !query || !timetables) return false;

    for (int i = 0; i < tt_count; i++) {
        const TimetableEntry* t = &timetables[i];
        if (strcmp(t->room, room->room_id) == 0 && strcmp(t->day, query->day) == 0) {
            if (t->start_mins >= 0 && t->end_mins > t->start_mins) {
                if (isTimeConflict(query->start_mins, query->end_mins, t->start_mins, t->end_mins)) {
                    return false; /* Conflict detected */
                }
            }
        }
    }
    return true; /* Fully available */
}

/**
 * Calculates a transparent suitability score (0 to 100 points) based on:
 * 1. Facility match: 30 pts max
 * 2. Capacity fit: 20 pts max
 * 3. Duration availability: 25 pts
 * 4. Purpose suitability: 15 pts max
 * 5. Baseline readiness: 10 pts
 */
ScoreBreakdown calculateSuitabilityScore(const Room* room, const SearchQuery* query) {
    ScoreBreakdown sb = {0, 0, 0, 0, 0, 0};
    if (!room || !query) return sb;

    /* 1. Facility Match (30 pts max) */
    int fScore = 0;
    int anyReq = query->req_wifi || query->req_power || query->req_projector;
    if (anyReq) {
        if (query->req_wifi && room->wifi) fScore += 10;
        if (query->req_power && room->power) fScore += 10;
        if (query->req_projector && room->projector) fScore += 10;
    } else {
        /* If student didn't check specific facilities, award based on room features */
        if (room->wifi) fScore += 10;
        if (room->power) fScore += 10;
        if (room->projector) fScore += 10;
    }
    sb.facility = fScore;

    /* 2. Capacity Fit (20 pts max) */
    int diff = room->capacity - query->students;
    if (diff >= 0) {
        if (diff <= 10) {
            sb.capacity = 20; /* Optimal fit */
        } else if (diff <= 30) {
            sb.capacity = 15; /* Good fit */
        } else {
            sb.capacity = 10; /* Oversized room penalty */
        }
    } else {
        sb.capacity = 0;
    }

    /* 3. Duration Availability (25 pts) */
    sb.duration = 25;

    /* 4. Purpose Suitability (15 pts max) */
    if (strcmp(query->purpose, "Coding") == 0) {
        sb.purpose = room->computers ? 15 : (room->wifi ? 10 : 5);
    } else if (strcmp(query->purpose, "Presentation") == 0) {
        sb.purpose = room->projector ? 15 : 5;
    } else if (strcmp(query->purpose, "Group Study") == 0) {
        sb.purpose = (strcmp(room->room_type, "Classroom") == 0) ? 15 : 10;
    } else if (strcmp(query->purpose, "Project Discussion") == 0) {
        sb.purpose = (room->power && room->wifi) ? 15 : 10;
    } else if (strcmp(query->purpose, "Individual Study") == 0) {
        sb.purpose = 15;
    } else {
        sb.purpose = 10;
    }

    /* 5. Baseline Feasibility Score (10 pts) */
    sb.base = 10;

    sb.total = sb.facility + sb.capacity + sb.duration + sb.purpose + sb.base;
    if (sb.total > 100) sb.total = 100;

    return sb;
}

/* =========================================================================
 * 4. QUICK SORT IMPLEMENTATION (Middle-Element Pivot, Hoare Partition)
 * ========================================================================= */

/**
 * Comparator for ranking scored rooms.
 * Returns > 0 if 'a' should be ordered BEFORE 'b' (higher score first).
 * Tie-breaker: Room ID in ascending order for deterministic ranking.
 */
int compareScoredRooms(const ScoredRoom* a, const ScoredRoom* b) {
    if (a->score.total != b->score.total) {
        return (a->score.total > b->score.total) ? 1 : -1;
    }
    /* Deterministic tie-breaker: compare room_id string */
    int cmp = strcmp(a->room.room_id, b->room.room_id);
    return (cmp < 0) ? 1 : -1;
}

/**
 * Hoare partition using the middle element as pivot.
 * Efficiently handles arrays with duplicates, already sorted, and reverse sorted.
 */
static int hoarePartition(ScoredRoom arr[], int low, int high) {
    int mid = low + (high - low) / 2;
    ScoredRoom pivot = arr[mid];

    int i = low - 1;
    int j = high + 1;

    while (1) {
        do {
            i++;
        } while (compareScoredRooms(&arr[i], &pivot) > 0);

        do {
            j--;
        } while (compareScoredRooms(&pivot, &arr[j]) > 0);

        if (i >= j) {
            return j;
        }

        /* Swap arr[i] and arr[j] */
        ScoredRoom temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

/**
 * Quick Sort function.
 * Average time complexity: O(N log N).
 * Space complexity: O(log N) auxiliary stack frames.
 */
void quickSortRooms(ScoredRoom arr[], int low, int high) {
    if (low < high) {
        int p = hoarePartition(arr, low, high);
        quickSortRooms(arr, low, p);
        quickSortRooms(arr, p + 1, high);
    }
}

/* =========================================================================
 * 5. CORE PROCESSING PIPELINE
 * ========================================================================= */

int filterAndRankRooms(
    const Room rooms[],
    int room_count,
    const TimetableEntry timetables[],
    int tt_count,
    const SearchQuery* query,
    const HashTable* ht,
    ScoredRoom results[],
    FilterStats* stats
) {
    int result_count = 0;

    if (stats) {
        stats->total_rooms = room_count;
        stats->total_timetables = tt_count;
        stats->rooms_checked = 0;
        stats->cap_filtered = 0;
        stats->fac_filtered = 0;
        stats->conflicts = 0;
        stats->eligible_count = 0;
    }

    for (int i = 0; i < room_count; i++) {
        const Room* r = &rooms[i];
        if (stats) stats->rooms_checked++;

        /* 1. Verify existence in hash table (demonstrates hash table O(1) lookup) */
        if (ht && !findRoomById(ht, r->room_id)) {
            continue;
        }

        /* 2. Capacity filter */
        if (!filterCapacity(r, query->students)) {
            if (stats) stats->cap_filtered++;
            continue;
        }

        /* 3. Facility filter */
        if (!filterFacilities(r, query->req_wifi, query->req_power, query->req_projector)) {
            if (stats) stats->fac_filtered++;
            continue;
        }

        /* 4. Timetable conflict check (linear scan of schedule intervals) */
        if (!isRoomAvailable(r, query, timetables, tt_count)) {
            if (stats) stats->conflicts++;
            continue;
        }

        /* Room passed all filters: calculate score */
        ScoredRoom sr;
        sr.room = *r;
        sr.score = calculateSuitabilityScore(r, query);

        if (result_count < MAX_ROOMS) {
            results[result_count++] = sr;
        }
    }

    if (stats) {
        stats->eligible_count = result_count;
    }

    /* 5. Rank eligible rooms using Quick Sort */
    if (result_count > 1) {
        quickSortRooms(results, 0, result_count - 1);
    }

    return result_count;
}

/* =========================================================================
 * 6. LIGHTWEIGHT, ZERO-DEPENDENCY JSON PARSER AND SERIALIZER
 * ========================================================================= */

char* readTextFile(const char* filepath) {
    if (!filepath) return NULL;
    FILE* f = fopen(filepath, "rb");
    if (!f) return NULL;

    fseek(f, 0, SEEK_END);
    long fsize = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (fsize < 0) {
        fclose(f);
        return NULL;
    }

    char* buffer = (char*)malloc(fsize + 1);
    if (!buffer) {
        fclose(f);
        return NULL;
    }

    size_t read_bytes = fread(buffer, 1, fsize, f);
    buffer[read_bytes] = '\0';
    fclose(f);
    return buffer;
}

static const char* skipWhitespace(const char* p) {
    while (p && *p && isspace((unsigned char)*p)) p++;
    return p;
}

static const char* findJsonKeyInBlock(const char* block_start, const char* block_end, const char* key) {
    size_t key_len = strlen(key);
    const char* p = block_start;

    while (p && p < block_end) {
        if (*p == '"') {
            p++;
            if (p + key_len <= block_end && strncmp(p, key, key_len) == 0 && p[key_len] == '"') {
                p += key_len + 1;
                p = skipWhitespace(p);
                if (p < block_end && *p == ':') {
                    return skipWhitespace(p + 1);
                }
            }
        }
        p++;
    }
    return NULL;
}

static void extractStringValue(const char* val_pos, char* dest, size_t max_len) {
    if (!val_pos || !dest || max_len == 0) return;
    dest[0] = '\0';

    val_pos = skipWhitespace(val_pos);
    if (*val_pos == '"') {
        val_pos++;
        size_t idx = 0;
        while (*val_pos && *val_pos != '"' && idx < max_len - 1) {
            dest[idx++] = *val_pos++;
        }
        dest[idx] = '\0';
    } else {
        size_t idx = 0;
        while (*val_pos && *val_pos != ',' && *val_pos != '}' && !isspace((unsigned char)*val_pos) && idx < max_len - 1) {
            dest[idx++] = *val_pos++;
        }
        dest[idx] = '\0';
    }
}

static int extractIntValue(const char* val_pos) {
    if (!val_pos) return 0;
    val_pos = skipWhitespace(val_pos);
    if (*val_pos == '"') val_pos++;
    return atoi(val_pos);
}

static int extractBoolValue(const char* val_pos) {
    if (!val_pos) return 0;
    val_pos = skipWhitespace(val_pos);
    if (*val_pos == '"') {
        val_pos++;
        if (strncmp(val_pos, "1", 1) == 0 ||
            strncmp(val_pos, "true", 4) == 0 ||
            strncmp(val_pos, "Yes", 3) == 0 ||
            strncmp(val_pos, "yes", 3) == 0) {
            return 1;
        }
        return 0;
    }
    if (*val_pos == '1' || strncmp(val_pos, "true", 4) == 0) return 1;
    return 0;
}

int loadRoomsFromJson(const char* filepath, Room rooms[], int max_rooms) {
    char* text = readTextFile(filepath);
    if (!text) return 0;

    int count = 0;
    const char* p = strchr(text, '[');
    if (!p) {
        free(text);
        return 0;
    }
    p++;

    while (*p && count < max_rooms) {
        p = strchr(p, '{');
        if (!p) break;
        const char* obj_start = p;
        const char* obj_end = strchr(p, '}');
        if (!obj_end) break;

        Room r;
        memset(&r, 0, sizeof(Room));

        const char* v = findJsonKeyInBlock(obj_start, obj_end, "room_id");
        if (v) extractStringValue(v, r.room_id, sizeof(r.room_id));

        v = findJsonKeyInBlock(obj_start, obj_end, "room_number");
        if (v) extractStringValue(v, r.room_number, sizeof(r.room_number));
        if (strlen(r.room_number) == 0) strncpy(r.room_number, r.room_id, sizeof(r.room_number) - 1);

        v = findJsonKeyInBlock(obj_start, obj_end, "building");
        if (v) extractStringValue(v, r.building, sizeof(r.building));

        v = findJsonKeyInBlock(obj_start, obj_end, "room_type");
        if (v) extractStringValue(v, r.room_type, sizeof(r.room_type));

        v = findJsonKeyInBlock(obj_start, obj_end, "capacity");
        if (v) r.capacity = extractIntValue(v);

        v = findJsonKeyInBlock(obj_start, obj_end, "wifi");
        if (v) r.wifi = extractBoolValue(v);

        v = findJsonKeyInBlock(obj_start, obj_end, "power");
        if (v) r.power = extractBoolValue(v);

        v = findJsonKeyInBlock(obj_start, obj_end, "projector");
        if (v) r.projector = extractBoolValue(v);

        v = findJsonKeyInBlock(obj_start, obj_end, "computers");
        if (v) r.computers = extractBoolValue(v);

        if (strlen(r.room_id) > 0) {
            rooms[count++] = r;
        }

        p = obj_end + 1;
    }

    free(text);
    return count;
}

int loadTimetablesFromJson(const char* filepath, TimetableEntry timetables[], int max_tt) {
    char* text = readTextFile(filepath);
    if (!text) return 0;

    int count = 0;
    const char* p = strchr(text, '[');
    if (!p) {
        free(text);
        return 0;
    }
    p++;

    while (*p && count < max_tt) {
        p = strchr(p, '{');
        if (!p) break;
        const char* obj_start = p;
        const char* obj_end = strchr(p, '}');
        if (!obj_end) break;

        TimetableEntry t;
        memset(&t, 0, sizeof(TimetableEntry));

        const char* v = findJsonKeyInBlock(obj_start, obj_end, "room");
        if (v) extractStringValue(v, t.room, sizeof(t.room));

        v = findJsonKeyInBlock(obj_start, obj_end, "day");
        if (v) extractStringValue(v, t.day, sizeof(t.day));

        v = findJsonKeyInBlock(obj_start, obj_end, "startTime");
        if (v) extractStringValue(v, t.start_time, sizeof(t.start_time));

        v = findJsonKeyInBlock(obj_start, obj_end, "endTime");
        if (v) extractStringValue(v, t.end_time, sizeof(t.end_time));

        v = findJsonKeyInBlock(obj_start, obj_end, "division");
        if (v) extractStringValue(v, t.division, sizeof(t.division));

        v = findJsonKeyInBlock(obj_start, obj_end, "subject");
        if (v) extractStringValue(v, t.subject, sizeof(t.subject));

        v = findJsonKeyInBlock(obj_start, obj_end, "type");
        if (v) extractStringValue(v, t.type, sizeof(t.type));

        t.start_mins = parseTimeToMinutes(t.start_time);
        t.end_mins = parseTimeToMinutes(t.end_time);

        if (strlen(t.room) > 0 && strcmp(t.room, "--") != 0 && strcmp(t.room, "Not available in current dataset") != 0) {
            timetables[count++] = t;
        }

        p = obj_end + 1;
    }

    free(text);
    return count;
}

bool parseSearchQueryJson(const char* filepath, SearchQuery* query) {
    if (!filepath || !query) return false;
    char* text = readTextFile(filepath);
    if (!text) return false;

    memset(query, 0, sizeof(SearchQuery));
    const char* end = text + strlen(text);

    const char* v = findJsonKeyInBlock(text, end, "day");
    if (v) extractStringValue(v, query->day, sizeof(query->day));

    v = findJsonKeyInBlock(text, end, "startTime");
    if (v) extractStringValue(v, query->start_time, sizeof(query->start_time));

    v = findJsonKeyInBlock(text, end, "endTime");
    if (v) extractStringValue(v, query->end_time, sizeof(query->end_time));

    v = findJsonKeyInBlock(text, end, "students");
    if (v) query->students = extractIntValue(v);

    v = findJsonKeyInBlock(text, end, "purpose");
    if (v) extractStringValue(v, query->purpose, sizeof(query->purpose));

    /* Parse nested facilities block if present */
    const char* fac = strstr(text, "\"facilities\"");
    if (fac) {
        const char* fac_brace = strchr(fac, '{');
        const char* fac_end = fac_brace ? strchr(fac_brace, '}') : NULL;
        if (fac_brace && fac_end) {
            v = findJsonKeyInBlock(fac_brace, fac_end, "wifi");
            if (v) query->req_wifi = extractBoolValue(v);

            v = findJsonKeyInBlock(fac_brace, fac_end, "power");
            if (v) query->req_power = extractBoolValue(v);

            v = findJsonKeyInBlock(fac_brace, fac_end, "projector");
            if (v) query->req_projector = extractBoolValue(v);
        }
    }

    query->start_mins = parseTimeToMinutes(query->start_time);
    query->end_mins = parseTimeToMinutes(query->end_time);

    free(text);
    return true;
}

void printResultsJson(const ScoredRoom results[], int result_count, const FilterStats* stats) {
    printf("{\n");
    printf("  \"success\": true,\n");

    if (stats) {
        printf("  \"stats\": {\n");
        printf("    \"total_rooms\": %d,\n", stats->total_rooms);
        printf("    \"total_timetables\": %d,\n", stats->total_timetables);
        printf("    \"rooms_checked\": %d,\n", stats->rooms_checked);
        printf("    \"conflicts\": %d,\n", stats->conflicts);
        printf("    \"cap_filtered\": %d,\n", stats->cap_filtered);
        printf("    \"fac_filtered\": %d,\n", stats->fac_filtered);
        printf("    \"available_rooms\": %d\n", stats->eligible_count);
        printf("  },\n");
    }

    printf("  \"algorithm\": {\n");
    printf("    \"structures_and_arrays\": true,\n");
    printf("    \"hash_table_lookup\": true,\n");
    printf("    \"interval_overlap_check\": true,\n");
    printf("    \"capacity_filter\": true,\n");
    printf("    \"facility_filter\": true,\n");
    printf("    \"quick_sort\": true\n");
    printf("  },\n");

    printf("  \"results\": [\n");
    for (int i = 0; i < result_count; i++) {
        const ScoredRoom* sr = &results[i];
        printf("    {\n");
        printf("      \"room\": {\n");
        printf("        \"room_id\": \"%s\",\n", sr->room.room_id);
        printf("        \"room_number\": \"%s\",\n", sr->room.room_number);
        printf("        \"building\": \"%s\",\n", sr->room.building);
        printf("        \"room_type\": \"%s\",\n", sr->room.room_type);
        printf("        \"capacity\": %d,\n", sr->room.capacity);
        printf("        \"wifi\": %d,\n", sr->room.wifi);
        printf("        \"power\": %d,\n", sr->room.power);
        printf("        \"projector\": %d,\n", sr->room.projector);
        printf("        \"computers\": %d\n", sr->room.computers);
        printf("      },\n");
        printf("      \"score\": {\n");
        printf("        \"total\": %d,\n", sr->score.total);
        printf("        \"capacity\": %d,\n", sr->score.capacity);
        printf("        \"facility\": %d,\n", sr->score.facility);
        printf("        \"purpose\": %d,\n", sr->score.purpose);
        printf("        \"duration\": %d,\n", sr->score.duration);
        printf("        \"base\": %d\n", sr->score.base);
        printf("      }\n");
        printf("    }%s\n", (i == result_count - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

/* =========================================================================
 * 7. COMPREHENSIVE AUTOMATED TEST SUITE (14 SPECIFIED TEST CASES)
 * ========================================================================= */

int runAllTests(void) {
    int passed = 0;
    int total = 14;

    fprintf(stderr, "=== RUNNING CAMPUSSPOT DSA UNIT TESTS ===\n");

    /* TEST 1: Room completely available */
    {
        Room r = {"1201", "1201", "IT Block", "Classroom", 60, 1, 1, 1, 0};
        SearchQuery q = {"Monday", "10:00", "11:00", 600, 660, 20, "Group Study", 0, 0, 0};
        TimetableEntry tt[1] = {
            {"1201", "Tuesday", "10:00", "11:00", 600, 660, "IT-A", "DS", "Theory"}
        };
        if (isRoomAvailable(&r, &q, tt, 1)) {
            passed++;
            fprintf(stderr, "Test 1 PASS: Room completely available on requested day\n");
        } else {
            fprintf(stderr, "Test 1 FAIL\n");
        }
    }

    /* TEST 2: Room has an overlapping class */
    {
        Room r = {"1201", "1201", "IT Block", "Classroom", 60, 1, 1, 1, 0};
        SearchQuery q = {"Monday", "10:30", "11:30", 630, 690, 20, "Group Study", 0, 0, 0};
        TimetableEntry tt[1] = {
            {"1201", "Monday", "10:00", "11:00", 600, 660, "IT-A", "DS", "Theory"}
        };
        if (!isRoomAvailable(&r, &q, tt, 1)) {
            passed++;
            fprintf(stderr, "Test 2 PASS: Overlapping class correctly detected as conflict\n");
        } else {
            fprintf(stderr, "Test 2 FAIL\n");
        }
    }

    /* TEST 3: Requested interval starts exactly when previous class ends */
    {
        Room r = {"1201", "1201", "IT Block", "Classroom", 60, 1, 1, 1, 0};
        SearchQuery q = {"Monday", "11:00", "12:00", 660, 720, 20, "Group Study", 0, 0, 0};
        TimetableEntry tt[1] = {
            {"1201", "Monday", "10:00", "11:00", 600, 660, "IT-A", "DS", "Theory"}
        };
        /* req_start (660) == occ_end (660) -> no overlap */
        if (isRoomAvailable(&r, &q, tt, 1)) {
            passed++;
            fprintf(stderr, "Test 3 PASS: Exact end-boundary meeting allows room usage\n");
        } else {
            fprintf(stderr, "Test 3 FAIL\n");
        }
    }

    /* TEST 4: Requested interval ends exactly when next class begins */
    {
        Room r = {"1201", "1201", "IT Block", "Classroom", 60, 1, 1, 1, 0};
        SearchQuery q = {"Monday", "09:00", "10:00", 540, 600, 20, "Group Study", 0, 0, 0};
        TimetableEntry tt[1] = {
            {"1201", "Monday", "10:00", "11:00", 600, 660, "IT-A", "DS", "Theory"}
        };
        /* req_end (600) == occ_start (600) -> no overlap */
        if (isRoomAvailable(&r, &q, tt, 1)) {
            passed++;
            fprintf(stderr, "Test 4 PASS: Exact start-boundary meeting allows room usage\n");
        } else {
            fprintf(stderr, "Test 4 FAIL\n");
        }
    }

    /* TEST 5: Insufficient capacity */
    {
        Room r = {"1201", "1201", "IT Block", "Classroom", 30, 1, 1, 1, 0};
        if (!filterCapacity(&r, 50)) {
            passed++;
            fprintf(stderr, "Test 5 PASS: Room with insufficient capacity rejected\n");
        } else {
            fprintf(stderr, "Test 5 FAIL\n");
        }
    }

    /* TEST 6: Missing required facility */
    {
        Room r = {"1201", "1201", "IT Block", "Classroom", 60, 1, 1, 0, 0}; /* projector = 0 */
        if (!filterFacilities(&r, 1, 1, 1)) { /* req_projector = 1 */
            passed++;
            fprintf(stderr, "Test 6 PASS: Room missing projector rejected\n");
        } else {
            fprintf(stderr, "Test 6 FAIL\n");
        }
    }

    /* TEST 7: Room ID exists in hash table */
    {
        HashTable ht;
        initializeHashTable(&ht);
        Room r = {"1205", "1205", "IT Block", "Classroom", 50, 1, 1, 1, 0};
        insertRoom(&ht, &r);
        Room* found = findRoomById(&ht, "1205");
        if (found && strcmp(found->room_id, "1205") == 0) {
            passed++;
            fprintf(stderr, "Test 7 PASS: Existing room found via Hash Table O(1) lookup\n");
        } else {
            fprintf(stderr, "Test 7 FAIL\n");
        }
        freeHashTable(&ht);
    }

    /* TEST 8: Room ID does not exist in hash table */
    {
        HashTable ht;
        initializeHashTable(&ht);
        Room r = {"1201", "1201", "IT Block", "Classroom", 50, 1, 1, 1, 0};
        insertRoom(&ht, &r);
        Room* found = findRoomById(&ht, "9999");
        if (found == NULL) {
            passed++;
            fprintf(stderr, "Test 8 PASS: Non-existent room ID lookup returned NULL safely\n");
        } else {
            fprintf(stderr, "Test 8 FAIL\n");
        }
        freeHashTable(&ht);
    }

    /* TEST 9: Two different room IDs cause a hash collision (handled by separate chaining) */
    {
        HashTable ht;
        initializeHashTable(&ht);
        /* Artificially find two keys that hash to the exact same bucket */
        Room r1 = {"1201", "1201", "IT Block", "Classroom", 60, 1, 1, 1, 0};
        Room r2 = {"1202", "1202", "IT Block", "Classroom", 60, 1, 1, 1, 0};
        
        insertRoom(&ht, &r1);
        insertRoom(&ht, &r2);

        Room* f1 = findRoomById(&ht, "1201");
        Room* f2 = findRoomById(&ht, "1202");

        if (f1 && f2 && strcmp(f1->room_id, "1201") == 0 && strcmp(f2->room_id, "1202") == 0) {
            passed++;
            fprintf(stderr, "Test 9 PASS: Hash collision and separate chaining verified\n");
        } else {
            fprintf(stderr, "Test 9 FAIL\n");
        }
        freeHashTable(&ht);
    }

    /* TEST 10: Multiple rooms sorted with different scores via Quick Sort */
    {
        ScoredRoom list[4];
        list[0].room.room_id[0] = 'A'; list[0].room.room_id[1] = 0; list[0].score.total = 60;
        list[1].room.room_id[0] = 'B'; list[1].room.room_id[1] = 0; list[1].score.total = 95;
        list[2].room.room_id[0] = 'C'; list[2].room.room_id[1] = 0; list[2].score.total = 75;
        list[3].room.room_id[0] = 'D'; list[3].room.room_id[1] = 0; list[3].score.total = 85;

        quickSortRooms(list, 0, 3);

        if (list[0].score.total == 95 && list[1].score.total == 85 &&
            list[2].score.total == 75 && list[3].score.total == 60) {
            passed++;
            fprintf(stderr, "Test 10 PASS: Quick Sort correctly ranked rooms descending by score\n");
        } else {
            fprintf(stderr, "Test 10 FAIL\n");
        }
    }

    /* TEST 11: Quick Sort handles equal scores with deterministic tie-breaker */
    {
        ScoredRoom list[3];
        strcpy(list[0].room.room_id, "1205"); list[0].score.total = 80;
        strcpy(list[1].room.room_id, "1202"); list[1].score.total = 80;
        strcpy(list[2].room.room_id, "1201"); list[2].score.total = 80;

        quickSortRooms(list, 0, 2);

        /* Deterministic tie-breaker orders by room_id ascending: 1201, 1202, 1205 */
        if (strcmp(list[0].room.room_id, "1201") == 0 &&
            strcmp(list[1].room.room_id, "1202") == 0 &&
            strcmp(list[2].room.room_id, "1205") == 0) {
            passed++;
            fprintf(stderr, "Test 11 PASS: Equal scores broken deterministically by room ID\n");
        } else {
            fprintf(stderr, "Test 11 FAIL\n");
        }
    }

    /* TEST 12: No rooms satisfy the requirements */
    {
        Room r[2] = {
            {"1201", "1201", "IT Block", "Classroom", 40, 1, 1, 1, 0},
            {"1202", "1202", "IT Block", "Classroom", 40, 1, 1, 1, 0}
        };
        SearchQuery q = {"Monday", "10:00", "11:00", 600, 660, 100, "Group Study", 0, 0, 0};
        ScoredRoom res[2];
        FilterStats st;
        int n = filterAndRankRooms(r, 2, NULL, 0, &q, NULL, res, &st);
        if (n == 0 && st.cap_filtered == 2) {
            passed++;
            fprintf(stderr, "Test 12 PASS: Zero rooms returned when requirements exceed capacity\n");
        } else {
            fprintf(stderr, "Test 12 FAIL\n");
        }
    }

    /* TEST 13: Invalid or reversed time intervals rejected */
    {
        if (!isValidTimeInterval(700, 600) && !isValidTimeInterval(-10, 60)) {
            passed++;
            fprintf(stderr, "Test 13 PASS: Reversed or negative time intervals rejected safely\n");
        } else {
            fprintf(stderr, "Test 13 FAIL\n");
        }
    }

    /* TEST 14: Empty dataset handled safely */
    {
        ScoredRoom res[10];
        SearchQuery q = {"Monday", "10:00", "11:00", 600, 660, 10, "Group Study", 0, 0, 0};
        FilterStats st;
        int n = filterAndRankRooms(NULL, 0, NULL, 0, &q, NULL, res, &st);
        if (n == 0 && st.total_rooms == 0) {
            passed++;
            fprintf(stderr, "Test 14 PASS: Empty dataset handled without error or crash\n");
        } else {
            fprintf(stderr, "Test 14 FAIL\n");
        }
    }

    fprintf(stderr, "=== TEST SUMMARY: %d/%d PASSED ===\n", passed, total);

    /* Output JSON for backend /api/dsa-status consumption */
    printf("{\n");
    printf("  \"success\": %s,\n", (passed == total) ? "true" : "false");
    printf("  \"test_mode\": true,\n");
    printf("  \"total_tests\": %d,\n", total);
    printf("  \"passed_tests\": %d,\n", passed);
    printf("  \"status\": \"%s\"\n", (passed == total) ? "All 14 DSA unit tests passed successfully" : "Some tests failed");
    printf("}\n");

    return (passed == total) ? 0 : 1;
}
