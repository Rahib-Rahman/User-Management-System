import { ButtonGroup, Button } from "react-bootstrap";
import Stack from "react-bootstrap/Stack";
import { LockOpen, Trash2, UserMinus } from "lucide-react";

export default function Toolbar({ onAction, hasSelection, selectedUsers }) {
    const hasUnverified = selectedUsers.some(u => u.status === 'unverified');
    const hasBlocked = selectedUsers.some(u => u.status === 'blocked');
    const hasActive = selectedUsers.some(u => u.status === 'active');

    return (
        <Stack direction="horizontal" gap={2} className="mb-3">
            {/* BLOCK button - enabled when users are selected */}
            <Button
                variant="outline-danger"
                disabled={!hasSelection}
                onClick={() => onAction("block", "blocked")}
                title="Block selected users"
            >
                Block
            </Button>

            {/* UNBLOCK button - icon style, enabled when users selected */}
            <Button
                variant="outline-success"
                disabled={!hasSelection}
                onClick={() => onAction("unblock", "active")}
                title="Unblock selected users (restore previous status)"
            >
                <LockOpen size={18} /> Unblock
            </Button>

            {/* DELETE button - icon style, enabled when users selected */}
            <Button
                variant="outline-danger"
                disabled={!hasSelection}
                onClick={() => onAction("delete")}
                title="Delete selected users"
            >
                <Trash2 size={18} />
            </Button>

            {/* DELETE UNVERIFIED button - icon style */}
            {/* Only enabled when at least one unverified user is selected */}
            <Button
                variant="outline-warning"
                disabled={!hasUnverified}
                onClick={() => onAction("deleteUnverified")}
                title="Delete unverified users"
            >
                <UserMinus size={18} />
            </Button>
        </Stack>
    );
}
