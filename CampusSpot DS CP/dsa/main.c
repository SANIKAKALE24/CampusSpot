#include "campusspot.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/**
 * CampusSpot - Smart Classroom & Study Space Finder
 * Core C DSA Engine Entry Point
 *
 * Usage:
 *   campusspot_dsa.exe --test
 *   campusspot_dsa.exe <input.json> [rooms.json] [timetable.json]
 */
int main(int argc, char** argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <input.json> [rooms.json] [timetable.json]\n", argv[0]);
        fprintf(stderr, "       %s --test\n", argv[0]);
        return 1;
    }

    /* 1. Automated Unit Test Mode */
    if (strcmp(argv[1], "--test") == 0) {
        return runAllTests();
    }

    /* 2. File Path Configuration */
    const char* input_path = argv[1];
    const char* rooms_path = (argc > 2) ? argv[2] : "public/data/rooms.json";
    const char* tt_path = (argc > 3) ? argv[3] : "public/data/preloaded_timetables.json";

    /* 3. Parse Search Request */
    SearchQuery query;
    if (!parseSearchQueryJson(input_path, &query)) {
        printf("{\n  \"success\": false,\n  \"error\": \"Failed to read or parse search query file.\"\n}\n");
        return 1;
    }

    /* 4. Validate Requested Time Interval */
    if (!isValidTimeInterval(query.start_mins, query.end_mins)) {
        printf("{\n  \"success\": false,\n  \"error\": \"Invalid or reversed time interval requested.\"\n}\n");
        return 1;
    }

    /* 5. Load Room Data into Array */
    Room rooms[MAX_ROOMS];
    int room_count = loadRoomsFromJson(rooms_path, rooms, MAX_ROOMS);
    if (room_count == 0) {
        /* Fallback if path was relative to root or public */
        room_count = loadRoomsFromJson("public/data/rooms.json", rooms, MAX_ROOMS);
    }

    /* 6. Initialize Hash Table and Insert Rooms (Separate Chaining for O(1) Lookup) */
    HashTable roomHashTable;
    initializeHashTable(&roomHashTable);
    for (int i = 0; i < room_count; i++) {
        insertRoom(&roomHashTable, &rooms[i]);
    }

    /* 7. Load Timetable Schedule Data into Array */
    TimetableEntry timetables[MAX_TIMETABLES];
    int tt_count = loadTimetablesFromJson(tt_path, timetables, MAX_TIMETABLES);
    if (tt_count == 0) {
        tt_count = loadTimetablesFromJson("public/data/preloaded_timetables.json", timetables, MAX_TIMETABLES);
    }

    /* 8. Filter Rooms, Check Interval Conflicts, Calculate Scores, and Quick Sort */
    ScoredRoom results[MAX_ROOMS];
    FilterStats stats;
    int eligible_count = filterAndRankRooms(
        rooms,
        room_count,
        timetables,
        tt_count,
        &query,
        &roomHashTable,
        results,
        &stats
    );

    /* 9. Output Formatted JSON Results to Standard Output */
    printResultsJson(results, eligible_count, &stats);

    /* 10. Clean up dynamically allocated memory */
    freeHashTable(&roomHashTable);

    return 0;
}