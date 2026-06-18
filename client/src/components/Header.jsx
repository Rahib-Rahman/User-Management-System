import { Navbar, Container, Button } from "react-bootstrap";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberMe");
    navigate("/login");
  };

  return (
      <Navbar bg="white" className="border-bottom shadow-sm sticky-top">
        <Container fluid>
          <Navbar.Brand className="fw-bold fs-5">
            Rahib User Management System
          </Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Button
                onClick={handleLogout}
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  );
}
