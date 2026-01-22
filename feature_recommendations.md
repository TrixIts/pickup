# App Review & Feature Recommendations

## Current State Review
**Status**: The application currently handles the "top of funnel" (Pickup Games) well but lacks the "bottom of funnel" (League Monetization).

-   ✅ **Pickup Discovery**: Map and List views are implemented (`src/app/pickup`).
-   ✅ **User Profiles**: Basic location and preference data is being captured (`src/lib/constants.ts`).
-   ✅ **Auth & Database**: Supabase infrastructure is in place.
-   ❌ **League Management**: Currently a placeholder.
-   ❌ **Monetization**: No payment implementation functionality yet.

## 10 Recommended Features

These features are prioritized to build the **League Platform** (the product you sell) and connect it to the **Pickup Network** (the resource you have).

### The League Product (What they pay for)
1.  **League Command Center (Admin Dashboard)**
    *   **Description**: A dedicated portal for League Commissioners to create Seasons, set up Divisions (e.g., "Monday Night Co-ed"), and register Teams.
    *   **Value**: Replaces the spreadsheets/Google Forms they currently use.
    *   **Tech**: New route `/admin/leagues` with heavy write-access rights.

2.  **Automated Scheduling Engine**
    *   **Description**: An algorithm where an admin inputs (Teams, Fields, Timeslots) and the system auto-generates a conflict-free Round Robin schedule.
    *   **Value**: This is the single biggest pain point for organizers.
    *   **Tech**: Logic to shuffle matchups and assign time/location slots.

3.  **Team Payment Collection**
    *   **Description**: Integrated Stripe payment links. Captains pay the league fee to register, or split the fee among players.
    *   **Value**: Organizers often chase Venmo payments for weeks. This solves cash flow.
    *   **Tech**: Stripe Connect integration.

4.  **Digital Waiver & Roster Management**
    *   **Description**: Players join a team via a shareable link and *must* sign a digital liability waiver to be added to the active roster.
    *   **Value**: Liability protection is critical for adult leagues.
    *   **Tech**: Electronic signature storage in Supabase.

5.  **League Standings & Leaderboards**
    *   **Description**: automatically updated W/L records, Points For/Against, and tie-breaker logic based on score reports.
    *   **Value**: Players love checking stats; it keeps them coming back to the app during the week.
    *   **Tech**: SQL views to aggregate game results into table rankings.

### The Recruiting Bridge (The "Secret Sauce")
6.  **"Free Agent" Scouting Database**
    *   **Description**: Allow League Admins to search the Pickup Player database using filters: *Sport*, *Skill Level*, *Commute Radius*, and *Availability*.
    *   **Value**: This is the "Upsell." Leagues can pay to access this recruitment pool to fill empty spots.

7.  **Player Reliability Score**
    *   **Description**: A backend metric that tracks a player's history. Did they RSVP to pickup and actually show up?
    *   **Value**: Leagues want *reliable* players. A "98% Attendance" badge makes a player highly recruitable.

8.  **"League Ready" Status Toggle**
    *   **Description**: A simple switch on the user profile: *"I am interested in joining a competitive league."*
    *   **Value**: Distinguishes casual drop-in players from potential league customers (leads).

### Operational Tools
9.  **Referee/Official Marketplace**
    *   **Description**: A "Gig" board where leagues can post game slots that need officials, and qualified users can claim them for a fee.
    *   **Value**: Solves the staffing shortage for leagues.

10. **Game Day Broadcast System**
    *   **Description**: One-click SMS/Email notifications from the League Admin to all players for "Rain Outs" or "Field Changes."
    *   **Value**: Uses your existing push notification infrastructure for critical league comms.
