

## Plan: Guest Management — Remove Room Column & Add Row-Click Preview

### Changes (single file: `src/pages/GuestManagement.tsx`)

**1. Remove the "Room" column from the table**
- Delete the `<TableHead>Room</TableHead>` header (line 680)
- Delete the `<TableCell>{guest.roomNumber || "—"}</TableCell>` cell (line 700)
- Update the empty-state `colSpan` from 8 to 7

**2. Add a guest preview dialog on row click**
- Add new state: `selectedGuest: Guest | null`
- Make each `<TableRow>` clickable (`onClick` → set `selectedGuest`, with `cursor-pointer` styling)
- Prevent the row click from firing when the actions dropdown is clicked (stop propagation)
- Render a new `<Dialog>` that shows the selected guest's details in a clean read-only layout:
  - Guest name, email, phone, booking ID
  - Room type, number of guests / children / infants
  - Check-in and check-out dates
  - Room number
- At the bottom of the dialog, two action buttons:
  - **Edit** — closes preview, opens the existing edit dialog (`openEdit`)
  - **Copy Web App Link** — copies the guest app link to clipboard (reuses existing logic)

### Technical details
- The preview dialog uses the existing `Dialog` / `DialogContent` components
- Guest details displayed using a two-column grid of label/value pairs
- Actions row uses `DialogFooter` with `Button` components (outline for Copy, default for Edit)

