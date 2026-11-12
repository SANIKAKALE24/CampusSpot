#include "availability.h"
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

/*
    Function: parse_time_mins

    Purpose:
    Converts time from HH:MM format into total minutes.

    Example:
    10:30 -> 10*60 + 30 = 630 minutes
*/
int parse_time_mins(const char* timeStr)
{
    int h, m;

    // Check if time is NULL or ':' is missing
    if (timeStr == NULL || strchr(timeStr, ':') == NULL)
        return 0;

    // Get hours and minutes from the time string
    sscanf(timeStr, "%d:%d", &h, &m);

    // Convert time into total minutes
    return h * 60 + m;
}


/*
    Function: check_time_conflict

    Purpose:
    Checks whether two time intervals overlap.

    reqStart, reqEnd:
    Student's requested time

    occStart, occEnd:
    Already occupied room time

    Returns:
    true  -> Time conflict exists
    false -> No conflict
*/
bool check_time_conflict(int reqStart, int reqEnd,
                         int occStart, int occEnd)
{
    /*
        Conflict occurs when:

        Requested start < Occupied end
        AND
        Requested end > Occupied start
    */

    if (reqStart < occEnd && reqEnd > occStart)
        return true;

    return false;
}