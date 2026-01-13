# Collected Ideas - System Functionality

This document collects ideas focused on improving the core system functionality of the AI Interactive Novel Generator. These are potential features or enhancements to the game mechanics, user experience, and technical capabilities.

## 1. Player-Selectable Story Complexity (NODE_NUM)

**Idea**: Allow players to choose story complexity at game start, instead of fixing NODE_NUM as an environment variable.

**Current State**:
- NODE_NUM controls minimum story nodes (default: 6), affecting story length and branching.
- Currently fixed to ensure consistent quality and performance.

**Potential Implementation**:
- Add a complexity selector in the game start form (e.g., "Simple", "Medium", "Complex").
- Map to nodeNum values: Simple=4, Medium=6, Complex=8.
- Pass as parameter to GameService.createNewGame().

**Benefits**:
- Increases customization and replayability.
- Allows players to match story length to their available time.

**Considerations**:
- Test AI generation quality with different node counts.
- Monitor performance impact (higher nodes = longer AI calls).
- Ensure minimum quality threshold (e.g., always include start + 2 endings).

**Status**: Idea proposed. Ready for prototyping if user feedback suggests value.

## 2. User System with Authentication and Save/Load

**Idea**: Implement a user authentication system using better-auth, allowing users to have personal play records and save/load game progress (like save slots).

**Current State**:
- Games are currently anonymous; no user accounts or persistence beyond a single session.
- Game state is stored in KV namespace with game_id, but no user association.

**Potential Implementation**:
- Integrate better-auth for authentication (supports multiple providers like email/password, OAuth).
- Add user table to D1 database (user_id, email, created_at, etc.).
- Modify game creation to associate with user_id.
- Add save/load functionality: users can save game state at any point, load from saved slots.
- Frontend: Add login/signup UI, save/load buttons in game interface.
- Backend: Extend GameService with save/load methods, store saves in database.

**Benefits**:
- Enables persistent gameplay across sessions.
- Increases user engagement and retention.
- Allows sharing or resuming stories later.
- Provides data for analytics (play time, completion rates).

**Considerations**:
- Privacy: Ensure user data compliance (GDPR/CCPA).
- Performance: Save/load operations should be fast, minimal impact on game flow.
- Storage: Limit save slots per user to prevent abuse.
- Migration: Handle existing anonymous games gracefully.
- Security: Protect user data and game saves.

**Status**: Idea proposed. High impact but requires significant backend/frontend changes.

## Next Steps for Implementation

- **Prioritize Ideas**: Evaluate based on user impact and development effort.
- **Prototype**: Start with NODE_NUM choice as it's low-risk and directly user-facing.
- **Testing**: Gather feedback on story quality and engagement.
- **Documentation**: Update README with new features once implemented.

**Date**: [Current Date]
**Focus**: System functionality only