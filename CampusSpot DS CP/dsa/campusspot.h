#ifndef CAMPUSSPOT_H
#define CAMPUSSPOT_H

#include <stdbool.h>
#include <stddef.h>

#define MAX_ROOMS 256
#define MAX_TIMETABLES 2048
#define HASH_TABLE_SIZE 31
#define STR_LEN 64
#define CODE_LEN 32

/* =========================================================================
 * 1. STRUCTURES AND DATA MODELS
 * ========================================================================= */

/**
 * Structure representing a classroom or lab space.
 */
typedef struct Room {
    char room_id[CODE_LEN];        /* Unique room identifier (e.g., "1201") */
    char room_number[CODE_LEN];    /* Room display number */
    char building[STR_LEN];        /* Building name (e.g., "IT Block") */
    char room_type[STR_LEN];       /* "Classroom", "Lab", etc. */
    int capacity;                  /* Maximum student capacity */
    int wifi;                      /* 1 if available, 0 otherwise */
    int power;                     /* 1 if power outlets available, 0 otherwise */
    int projector;                 /* 1 if projector available, 0 otherwise */
    int computers;                 /* 1 if lab computers available, 0 otherwise */
} Room;

/**
 * Structure representing a single timetable schedule entry.
 */
typedef struct TimetableEntry {
    char room[CODE_LEN];           /* Room identifier */
    char day[CODE_LEN];            /* Day of week: "Monday", "Tuesday", etc. */
    char start_time[CODE_LEN];     /* Original HH:MM string */
    char end_time[CODE_LEN];       /* Original HH:MM string */
    int start_mins;                /* Converted minutes from midnight */
    int end_mins;                  /* Converted minutes from midnight */
    char division[CODE_LEN];       /* e.g., "IT-A", "IT-D" */
    char subject[STR_LEN];         /* Subject name */
    char type[CODE_LEN];           /* "Theory", "Lab", "Tutorial" */
} TimetableEntry;

/**
 * Structure representing student search criteria.
 */
typedef struct SearchQuery {
    char day[CODE_LEN];
    char start_time[CODE_LEN];
    char end_time[CODE_LEN];
    int start_mins;
    int end_mins;
    int students;
    char purpose[STR_LEN];
    int req_wifi;
    int req_power;
    int req_projector;
} SearchQuery;

/**
 * Score breakdown for transparent reporting and viva explanation.
 */
typedef struct ScoreBreakdown {
    int total;                     /* Total score out of 100 */
    int capacity;                  /* Capacity match (0-20 pts) */
    int facility;                  /* Facilities match (0-30 pts) */
    int purpose;                   /* Purpose match (0-15 pts) */
    int duration;                  /* Availability match (25 pts) */
    int base;                      /* Baseline feasibility score (10 pts) */
} ScoreBreakdown;

/**
 * Ranked room item containing room details and calculated score.
 */
typedef struct ScoredRoom {
    Room room;
    ScoreBreakdown score;
} ScoredRoom;

/**
 * Execution statistics for inspection and React dashboard reporting.
 */
typedef struct FilterStats {
    int total_rooms;
    int total_timetables;
    int rooms_checked;
    int cap_filtered;
    int fac_filtered;
    int conflicts;
    int eligible_count;
} FilterStats;

/* =========================================================================
 * 2. HASH TABLE WITH SEPARATE CHAINING
 * ========================================================================= */

/**
 * Node for singly linked list collision chaining.
 */
typedef struct HashNode {
    Room room;
    struct HashNode* next;
} HashNode;

/**
 * Hash table structure with fixed bucket array for separate chaining.
 */
typedef struct HashTable {
    HashNode* buckets[HASH_TABLE_SIZE];
    int count;
} HashTable;

/* Hash table functions */
unsigned int hashFunction(const char* key);
void initializeHashTable(HashTable* ht);
bool insertRoom(HashTable* ht, const Room* room);
Room* findRoomById(const HashTable* ht, const char* room_id);
void freeHashTable(HashTable* ht);

/* =========================================================================
 * 3. TIME AND INTERVAL UTILITIES
 * ========================================================================= */

int parseTimeToMinutes(const char* time_str);
void formatMinutesToTime(int minutes, char* buffer, size_t buf_size);
bool isValidTimeInterval(int start_mins, int end_mins);
bool isTimeConflict(int req_start, int req_end, int occ_start, int occ_end);

/* =========================================================================
 * 4. FILTERING AND SCORING
 * ========================================================================= */

bool filterCapacity(const Room* room, int required_students);
bool filterFacilities(const Room* room, int req_wifi, int req_power, int req_projector);
bool isRoomAvailable(const Room* room, const SearchQuery* query, const TimetableEntry timetables[], int tt_count);
ScoreBreakdown calculateSuitabilityScore(const Room* room, const SearchQuery* query);

/* =========================================================================
 * 5. QUICK SORT
 * ========================================================================= */

int compareScoredRooms(const ScoredRoom* a, const ScoredRoom* b);
void quickSortRooms(ScoredRoom arr[], int low, int high);

/* =========================================================================
 * 6. CORE PROCESSING PIPELINE
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
);

/* =========================================================================
 * 7. JSON FILE I/O HELPERS
 * ========================================================================= */

char* readTextFile(const char* filepath);
int loadRoomsFromJson(const char* filepath, Room rooms[], int max_rooms);
int loadTimetablesFromJson(const char* filepath, TimetableEntry timetables[], int max_tt);
bool parseSearchQueryJson(const char* filepath, SearchQuery* query);
void printResultsJson(const ScoredRoom results[], int result_count, const FilterStats* stats);

/* =========================================================================
 * 8. AUTOMATED TESTING DRIVER
 * ========================================================================= */

int runAllTests(void);

#endif /* CAMPUSSPOT_H */
