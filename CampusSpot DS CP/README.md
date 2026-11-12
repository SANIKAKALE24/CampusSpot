# CampusSpot – Smart Classroom & Study Space Finder

> **A Complete, Viva-Ready College Data Structures & Algorithms (DSA) Project**  
> Built with **C (Core DSA Engine)**, **Node.js / Express (Process Bridge)**, and **React + Vite (Modern Web Frontend)**.

---

## 1. Project Objective & Overview

**CampusSpot** solves a daily university problem: students need classrooms, seminar rooms, or computer labs for study sessions, coding practice, club activities, or project discussions, but college timetables are complex and constantly occupied by lectures and laboratory sessions.

CampusSpot allows students to input:
- **Day of week** (e.g., Monday, Tuesday)
- **Time interval** (e.g., 12:00 to 13:00)
- **Number of students** (capacity requirement)
- **Purpose of use** (Coding, Presentation, Group Study, Project Discussion, Individual Study)
- **Mandatory facilities** (Wi-Fi, Power Outlets, Projector)

The system filters out rooms with timetable conflicts or insufficient amenities, evaluates eligible spaces using a **transparent suitability scoring formula (out of 100)**, and ranks them using **Quick Sort**.

---

## 2. Technology Stack & Component Roles

| Layer | Technology | Role & Responsibility |
| :--- | :--- | :--- |
| **DSA Engine** | **C (C11 / GCC)** | The computational core. Implements structures, hash table lookups, timetable interval overlap checking, capacity/facility filters, suitability scoring, and Quick Sort. Strictly contained in **2 C source files** (`campusspot.c`, `main.c`) and **1 header** (`campusspot.h`). |
| **Backend API** | **Node.js & Express** | Acts as a controlled process bridge. Receives requests from React, writes temporary inputs, spawns the compiled C binary via `child_process.execFile`, captures standard output, and returns structured JSON to the client. |
| **Web Frontend** | **React 19 + Vite** | Provides the user interface: interactive search form (`FindSpace.jsx`), ranked results display (`Results.jsx`), room details (`RoomDetails.jsx`), master timetable viewer (`Timetable.jsx`), and live algorithm visualization (`DSAProcessing.jsx`). |

---

## 3. Core DSA Concepts (The 4 Pillars)

The refactored DSA engine implements **only 4 foundational concepts**, keeping the codebase elegant, robust, and easy to explain during viva:

```
+-----------------------------------------------------------------------------------+
|                           CAMPUSSPOT CORE DSA ENGINE                              |
+-----------------------------------------------------------------------------------+
|  1. Structures & Arrays   | Fixed-size contiguous arrays for Room and Timetable   |
|  2. Hash Table            | 31-bucket prime table with Separate Chaining for O(1) |
|  3. Interval Checking     | Half-open overlap [reqStart, reqEnd) vs [occ, occEnd) |
|  4. Quick Sort            | Middle-pivot Hoare partition with ID tie-breaking    |
+-----------------------------------------------------------------------------------+
```

### 1. Structures and Arrays
- **Structures (`struct Room`, `struct TimetableEntry`, `struct SearchQuery`, `struct ScoredRoom`)**:
  Group heterogeneous room properties (capacity, facilities, identifiers) and schedule entries (day, start time, end time, division, subject).
- **Contiguous Static Arrays (`Room rooms[MAX_ROOMS]`, `TimetableEntry timetables[MAX_TIMETABLES]`)**:
  Provide sequential memory storage, cache friendliness, and predictable memory footprint.

### 2. Hash Table with Separate Chaining
- **Purpose**: Fast $O(1)$ average-time lookup and verification of room details by `room_id`.
- **Bucket Array**: Fixed prime size `HASH_TABLE_SIZE = 31` to promote uniform distribution.
- **Hash Function**: The classic **djb2** hash algorithm:
  $$\text{hash} = ((\text{hash} \ll 5) + \text{hash}) + c = \text{hash} \times 33 + c$$
- **Collision Handling**: **Separate Chaining** via singly linked list nodes (`HashNode*`). If two distinct room IDs hash to the same bucket index, the new node is prepended to the bucket's linked list in $O(1)$ time. Memory is cleaned up via `freeHashTable()`.

### 3. Linear Search and Interval Overlap Checking
- **Schedule Traversal**: For each candidate room, the engine scans the timetable array for entries matching the room ID and requested day.
- **Half-Open Interval Model**: Classes and room bookings are modeled as half-open intervals:
  $$[\text{start}, \text{end})$$
- **Conflict Formula**: A conflict occurs if and only if:
  $$\text{req\_start} < \text{occ\_end} \quad \text{AND} \quad \text{req\_end} > \text{occ\_start}$$
- **Exact Boundary Handling**:
  - If a requested search starts exactly when an occupied lecture ends ($\text{req\_start} = \text{occ\_end}$), $\text{req\_start} < \text{occ\_end}$ is **False** $\rightarrow$ **NO CONFLICT**.
  - If a requested search ends exactly when the next lecture begins ($\text{req\_end} = \text{occ\_start}$), $\text{req\_end} > \text{occ\_start}$ is **False** $\rightarrow$ **NO CONFLICT**.
- **Hard Filters**:
  - Capacity filter: $\text{room.capacity} \ge \text{query.students}$.
  - Facilities filter: Room must possess all user-checked facilities (Wi-Fi, Power, Projector).

### 4. Quick Sort
- **Purpose**: Sort eligible, conflict-free rooms in descending order of suitability score.
- **Pivot Selection**: **Middle element** ($\text{low} + (\text{high} - \text{low}) / 2$) to guard against $O(N^2)$ worst-case performance on already-sorted or reverse-sorted datasets.
- **Partitioning Scheme**: **Hoare partition**, which uses two pointers moving inward from both ends and performs fewer swaps than Lomuto's partition.
- **Deterministic Tie-Breaking**: When two rooms have the exact same suitability score, ties are broken deterministically by alphabetical `room_id` order (`strcmp(a.room.room_id, b.room.room_id) < 0`).

---

## 4. Transparent Suitability Scoring Formula

Eligible rooms that pass all hard filters are scored out of **100 maximum points**:

$$\text{Total Score} = \text{Facility (30)} + \text{Capacity (20)} + \text{Duration (25)} + \text{Purpose (15)} + \text{Base (10)}$$

| Component | Max Points | Scoring Criteria |
| :--- | :---: | :--- |
| **Facility Match** | **30 pts** | +10 for Wi-Fi match, +10 for Power outlets match, +10 for Projector match. |
| **Capacity Fit** | **20 pts** | Let $\Delta = \text{room.capacity} - \text{requested\_students}$:<br>• $\Delta \le 10$: **20 pts** (optimal fit, minimal wasted space)<br>• $\Delta \le 30$: **15 pts** (good fit)<br>• $\Delta > 30$: **10 pts** (room is excessively large) |
| **Duration Match** | **25 pts** | **25 pts** awarded because room is fully vacant for the entire requested time window. |
| **Purpose Match** | **15 pts** | • **Coding**: 15 pts if computers present, 10 if Wi-Fi present, else 5.<br>• **Presentation**: 15 pts if projector present, else 5.<br>• **Group Study**: 15 pts if Classroom, else 10.<br>• **Project Discussion**: 15 pts if power & Wi-Fi present, else 10.<br>• **Individual Study**: 15 pts. |
| **Base Score** | **10 pts** | Baseline feasibility awarded to any room meeting all hard constraints. |

---

## 5. End-to-End System Architecture

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|  - FindSpace.jsx: Captures Day, Time, Students, Purpose, Facilities     |
|  - Submits POST request to Node.js backend                             |
+------------------------------------+------------------------------------+
                                     | JSON Request Body
                                     v
+------------------------------------+------------------------------------+
|                         NODE.JS / EXPRESS BACKEND                       |
|  - server.js (Port 3001)                                               |
|  - Writes temp_input.json & temp_tt.json                                |
|  - Spawns C process: execFile('campusspot_dsa.exe', [input, rooms, tt]) |
+------------------------------------+------------------------------------+
                                     | CLI Arguments & File Paths
                                     v
+------------------------------------+------------------------------------+
|                           C DSA ENGINE BINARY                           |
|  1. main.c: Parses arguments and validates requested time interval     |
|  2. campusspot.c: Loads rooms into static array & Hash Table (O(1))     |
|  3. Linear Scan: Checks timetable intervals for schedule overlap       |
|  4. Hard Filters: Filters by capacity & mandatory facilities           |
|  5. Scoring: Computes suitability score (0 - 100)                      |
|  6. Quick Sort: Middle-pivot Hoare partition with tie-breaker          |
|  7. Serializes ranked results to JSON via stdout                       |
+------------------------------------+------------------------------------+
                                     | JSON Output via stdout
                                     v
+------------------------------------+------------------------------------+
|                         NODE.JS / EXPRESS BACKEND                       |
|  - Captures stdout, validates JSON, returns HTTP 200 response           |
+------------------------------------+------------------------------------+
                                     | HTTP JSON Response
                                     v
+------------------------------------+------------------------------------+
|                              REACT FRONTEND                             |
|  - Results.jsx: Displays ranked room cards and score breakdown         |
|  - DSAProcessing.jsx: Visualizes Quick Sort & Hash Table statistics    |
+-------------------------------------------------------------------------+
```

---

## 6. Time and Space Complexity Analysis

| Operation / Algorithm | Best Case | Average Case | Worst Case | Auxiliary Space | Explanation |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Hash Table Insert** | $O(1)$ | $O(1)$ | $O(1)$ | $O(1)$ per node | Prepend node to bucket head in separate chaining. |
| **Hash Table Lookup** | $O(1)$ | $O(1)$ | $O(N)$ | $O(1)$ | $O(1)$ when keys distribute evenly across 31 buckets; $O(N)$ only if all keys collide into one single bucket. |
| **Hash Table Free** | $O(N)$ | $O(N)$ | $O(N)$ | $O(1)$ | Traverses all 31 buckets and deallocates every linked list node. |
| **Interval Conflict Check** | $O(1)$ | $O(1)$ | $O(1)$ | $O(1)$ | Direct mathematical comparison: $\text{req\_start} < \text{occ\_end} \land \text{req\_end} > \text{occ\_start}$. |
| **Room Availability Scan** | $O(1)$ | $O(T)$ | $O(T)$ | $O(1)$ | Linear scan through $T$ timetable entries for a specific room and day. |
| **Overall Room Filtering** | $O(R \times T)$ | $O(R \times T)$ | $O(R \times T)$ | $O(1)$ | For $R$ rooms and $T$ schedule entries, checks conflicts. |
| **Quick Sort Ranking** | $O(K \log K)$ | $O(K \log K)$ | $O(K^2)$ | $O(\log K)$ | $K$ is the number of eligible rooms. Middle-pivot prevents worst-case on sorted data; $O(\log K)$ stack frames. |

---

## 7. Folder Structure & Organization

```
CampusSpot/
├── backend/
│   ├── package.json               # Backend dependencies (Express, Cors)
│   ├── server.js                  # Express API bridge to C binary
│   ├── temp_input.json            # Transient query file generated by API
│   └── temp_tt.json               # Transient timetable file generated by API
├── dsa/
│   ├── campusspot.h               # Core header: structs, prototypes, constants
│   ├── campusspot.c               # Core engine: Hash table, intervals, QuickSort, tests
│   ├── main.c                     # Program entry point and execution driver
│   └── campusspot_dsa.exe         # Compiled C binary
├── public/
│   └── data/
│       ├── rooms.json             # Master list of campus rooms and amenities
│       ├── preloaded_timetables.json # Complete timetable dataset (IT-A, B, C, D)
│       └── campusspot_data_manifest.json # Metadata manifest
├── src/
│   ├── components/                # Reusable UI elements (Navbar, Footer, etc.)
│   ├── pages/
│   │   ├── FindSpace.jsx          # Search form for date, time, capacity, facilities
│   │   ├── Results.jsx            # Ranked room cards with suitability scores
│   │   ├── DSAProcessing.jsx      # Live visualizer for QuickSort & Hash Table
│   │   ├── Rooms.jsx              # Directory of all campus spaces
│   │   ├── RoomDetails.jsx        # Deep dive into individual room details
│   │   ├── Timetable.jsx          # Visual weekly schedule inspector
│   │   └── AdminDashboard.jsx     # Room management and system analytics
│   ├── utils/
│   │   └── dsa.js                 # Frontend data loaders & reference helpers
│   ├── App.jsx                    # Root routing setup
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Custom styling
├── package.json                   # Root configuration & scripts
└── README.md                      # Comprehensive documentation and viva guide
```

---

## 8. Automated Unit Testing (14 Test Scenarios)

The C engine includes an integrated test suite (`campusspot_dsa.exe --test`) covering all 14 mandatory test conditions:

| # | Test Scenario | Input / Setup | Verified Behavior | Status |
| :-: | :--- | :--- | :--- | :-: |
| **1** | Room completely available | Tuesday query on a room with class on Monday | Returns available; no conflicts detected | **PASS** |
| **2** | Room has overlapping class | Query 10:30–11:30 vs Class 10:00–11:00 | Conflict detected; room correctly rejected | **PASS** |
| **3** | Exact end-boundary meeting | Query 11:00–12:00 vs Class 10:00–11:00 | $\text{req\_start} = \text{occ\_end} \rightarrow$ No conflict; available | **PASS** |
| **4** | Exact start-boundary meeting | Query 09:00–10:00 vs Class 10:00–11:00 | $\text{req\_end} = \text{occ\_start} \rightarrow$ No conflict; available | **PASS** |
| **5** | Insufficient capacity | Room capacity 30 vs Query 50 students | Capacity filter rejects room immediately | **PASS** |
| **6** | Missing required facility | Room has no projector vs Query requires projector | Facility filter rejects room | **PASS** |
| **7** | Room exists in Hash Table | Insert Room "1205", query "1205" | Room located in $O(1)$ time; attributes verified | **PASS** |
| **8** | Room ID does not exist | Lookup "9999" | Returns `NULL` safely without crash | **PASS** |
| **9** | Hash collision handling | Two keys mapping to identical bucket index | Separate chaining stores both; both retrievable | **PASS** |
| **10** | Quick Sort score ranking | 4 rooms with scores `[60, 95, 75, 85]` | Ranked descending: `[95, 85, 75, 60]` | **PASS** |
| **11** | Quick Sort tie-breaking | Rooms "1205", "1202", "1201" all scored 80 | Deterministic tie-breaker orders: `1201, 1202, 1205` | **PASS** |
| **12** | No rooms satisfy requirements | Query 100 students (all rooms have cap $\le 66$) | Returns 0 eligible rooms safely | **PASS** |
| **13** | Invalid / reversed interval | Start 14:00, End 12:00 or negative values | `isValidTimeInterval` returns false; rejected | **PASS** |
| **14** | Empty dataset handling | 0 rooms and 0 timetable entries passed | Handled gracefully without crash or buffer overrun | **PASS** |

---

## 9. How to Compile, Test, and Run

### Step 1: Compile the C DSA Engine
From the project root directory, run GCC:
```bash
gcc -Wall -Wextra dsa/main.c dsa/campusspot.c -o dsa/campusspot_dsa.exe
```
*(On Linux or macOS, replace `.exe` with no extension: `gcc -Wall -Wextra dsa/main.c dsa/campusspot.c -o dsa/campusspot_dsa`)*

### Step 2: Run Automated Unit Tests
```bash
./dsa/campusspot_dsa.exe --test
```
You will see all 14 test cases pass with a structured JSON output:
```json
{
  "success": true,
  "test_mode": true,
  "total_tests": 14,
  "passed_tests": 14,
  "status": "All 14 DSA unit tests passed successfully"
}
```

### Step 3: Start the Backend Bridge
```bash
cd backend
node server.js
```
The backend starts on `http://localhost:3001` and connects to the compiled binary.

### Step 4: Start the React Frontend
In a separate terminal from the root folder:
```bash
npm run dev:frontend
```
Open your browser at `http://localhost:5173`. You can now search for spaces, view ranked results, and inspect live algorithm execution!

---

## 10. College Viva & Evaluation Q&A Cheat Sheet

### Q1: Why did you use a Hash Table if you already had an array of rooms?
> **Answer**:  
> In CampusSpot, the array stores the contiguous list of rooms loaded from file. However, when processing timetable entries or querying specific room properties by `room_id`, an array would require an $O(N)$ linear search every single time. A **Hash Table** allows us to look up any room by its string ID in **$O(1)$ average time**, greatly optimizing repeated lookups.

### Q2: How does your Hash Table handle collisions?
> **Answer**:  
> We use **Separate Chaining**. The hash table has 31 buckets. When two distinct room IDs produce the same hash index via the `djb2` hash function, each bucket acts as the head of a singly linked list (`HashNode`). New colliding items are inserted at the head of the list in $O(1)$ time. When searching, we jump directly to the bucket index and traverse the short list to find the matching room ID.

### Q3: What is the interval conflict formula and how do you handle exact boundary times?
> **Answer**:  
> We treat time as half-open intervals $[\text{start}, \text{end})$. Two intervals $[\text{reqStart}, \text{reqEnd})$ and $[\text{occStart}, \text{occEnd})$ conflict if and only if:  
> `reqStart < occEnd && reqEnd > occStart`.  
> If a requested time starts exactly when a class finishes ($\text{reqStart} = \text{occEnd}$), then `reqStart < occEnd` evaluates to **False**, meaning there is **no conflict** and the room is available.

### Q4: Why Quick Sort instead of Bubble Sort or Merge Sort?
> **Answer**:  
> Quick Sort is an in-place sorting algorithm with an average time complexity of **$O(N \log N)$** and minimal memory overhead ($O(\log N)$ stack frames vs $O(N)$ auxiliary memory for Merge Sort). We choose the **middle element as pivot** to avoid the worst-case $O(N^2)$ on already-sorted or reverse-sorted data, and we use **Hoare's partitioning scheme**, which performs significantly fewer element swaps than Lomuto's partition.

### Q5: How do you guarantee deterministic sorting when two rooms have the same score?
> **Answer**:  
> In `compareScoredRooms()`, if two rooms have identical suitability scores (`a->score.total == b->score.total`), we break the tie using `strcmp(a->room.room_id, b->room.room_id) < 0`. This ensures that room ordering is completely predictable and reproducible.

### Q6: How does the React frontend interact with the C binary?
> **Answer**:  
> The React form sends search parameters to the Node.js Express server via a `POST /api/find-spaces` request. Express writes the input parameters to a temporary JSON file and executes the compiled C binary via `child_process.execFile()`. The C program performs the filtering, scoring, and Quick Sort, and prints the result as JSON to `stdout`. Express reads `stdout`, parses the JSON, and sends it back to React to render the room cards.

---

## 11. Known Limitations & Future Improvements

1. **Static Dataset Size**: The current C engine uses fixed arrays sized for 256 rooms and 2048 timetable entries. Dynamic array resizing (`realloc`) can be added for massive campus campuses with tens of thousands of sections.
2. **Dynamic Live Bookings**: Currently, timetables are loaded from the university schedule. Integrating a real-time reservation database (e.g., PostgreSQL or SQLite) would allow instant student room bookings on top of scheduled classes.
3. **Multi-Floor GPS Navigation**: Future versions could incorporate a indoor mapping model to calculate walking distance from the student's current GPS location.
