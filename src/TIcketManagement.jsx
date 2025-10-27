import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import {
  LogOut,
  Plus,
  Search,
  Trash2,
  Edit,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TicketManagement.css";

// ------------------------------------------------------------------
// ⭐ MOCK FIREBASE CONFIGURATION (Remains the same) ⭐
// ------------------------------------------------------------------
const MOCK_PROJECT_ID = "TICKET_APP_MOCK_PROJECT";

const firebaseConfig = {
  apiKey: "AIzaSyC_MockApiKey",
  authDomain: `${MOCK_PROJECT_ID}.firebaseapp.com`,
  projectId: MOCK_PROJECT_ID,
  storageBucket: `${MOCK_PROJECT_ID}.appspot.com`,
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const appId = firebaseConfig.appId;
const initialAuthToken = null;

// --- FIRESTORE UTILITIES ---
const useTicketData = () => {
  const [tickets, setTickets] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 1. Authentication Effect - FIX APPLIED HERE
  useEffect(() => {
    const initializeAuth = async () => {
      let currentUserId = auth.currentUser?.uid;

      // If no user is logged in (expected with mock config), force anonymous sign-in attempt
      if (!currentUserId) {
        try {
          await signInAnonymously(auth);
          currentUserId = auth.currentUser?.uid;
          console.log("Signed in anonymously successfully.");
        } catch (error) {
          console.error(
            "Anonymous sign-in failed (expected with mock config):",
            error
          );
          // Fallback: If sign-in fails, generate a local random ID for rendering
          currentUserId = crypto.randomUUID();
        }
      }

      // Set the final user ID and mark auth as ready to render the UI
      setUserId(currentUserId);
      setIsAuthReady(true);
    };

    initializeAuth();
  }, []);

  // 2. Data Listener Effect (Runs ONLY when auth is ready)
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    console.log(`Setting up listener for user: ${userId}`);

    // Firestore Security Rule path for PRIVATE data (or shared in this single-user context)
    const collectionPath = `artifacts/${appId}/users/${userId}/tickets`;
    const ticketsCollection = collection(db, collectionPath);

    // We avoid orderBy() to prevent needing indexes, and will sort in-memory.
    const q = query(ticketsCollection);

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate
            ? doc.data().createdAt.toDate()
            : new Date(),
        }));

        // Sort in-memory (e.g., by createdAt descending)
        fetchedTickets.sort((a, b) => b.createdAt - a.createdAt);

        setTickets(fetchedTickets);
        console.log(`Fetched ${fetchedTickets.length} tickets.`);
      },
      (error) => {
        console.error("Firestore error:", error);
      }
    );

    return () => unsubscribeSnapshot();
  }, [isAuthReady, userId]);

  // Data Actions (CRUD)
  const addTicket = useCallback(
    async (newTicket) => {
      try {
        if (!userId) {
          throw new Error("User not authenticated for writing.");
        }
        const collectionPath = `artifacts/${appId}/users/${userId}/tickets`;
        await addDoc(collection(db, collectionPath), {
          ...newTicket,
          status: "Open",
          priority: newTicket.priority || "Medium",
          createdAt: new Date(),
          userId: userId,
        });
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    },
    [userId]
  );

  const updateTicket = useCallback(
    async (id, updates) => {
      try {
        if (!userId) {
          throw new Error("User not authenticated for writing.");
        }
        const docRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/tickets`,
          id
        );
        await updateDoc(docRef, updates);
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    },
    [userId]
  );

  const deleteTicket = useCallback(
    async (id) => {
      try {
        if (!userId) {
          throw new Error("User not authenticated for writing.");
        }
        const docRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/tickets`,
          id
        );
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    },
    [userId]
  );

  return {
    tickets,
    addTicket,
    updateTicket,
    deleteTicket,
    userId,
    isAuthReady,
  };
};

// --- Custom Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--confirm">
        <AlertTriangle size={32} className="modal-icon--alert" />
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn--secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="modal-btn--danger">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Ticket Form Component ---
const TicketForm = ({ isEditing, initialData, onSubmit }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [priority, setPriority] = useState(initialData?.priority || "Medium");

  useEffect(() => {
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setPriority(initialData?.priority || "Medium");
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSubmit({ title, description, priority });

    // Reset form if not editing
    if (!isEditing) {
      setTitle("");
      setDescription("");
      setPriority("Medium");
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">
        {isEditing ? "Edit Ticket" : "Create New Ticket"}
      </h2>
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary of the issue"
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the bug or task"
            className="form-textarea"
            rows="3"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="form-select"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <button type="submit" className="form-submit-btn">
          {isEditing ? "Save Changes" : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
};

// --- Ticket List Component ---
const TicketList = ({
  tickets,
  updateTicket,
  onDeleteClick,
  setEditingTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredTickets = tickets
    .filter(
      (ticket) => filterStatus === "All" || ticket.status === filterStatus
    )
    .filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleStatusChange = (id, newStatus) => {
    updateTicket(id, { status: newStatus });
  };

  const handlePriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "ticket-priority--high";
      case "Medium":
        return "ticket-priority--medium";
      case "Low":
        return "ticket-priority--low";
      default:
        return "";
    }
  };

  return (
    <div className="list-container">
      <div className="list-controls">
        <div className="list-search-group">
          <Search size={20} className="list-search-icon" />
          <input
            type="text"
            placeholder="Search tickets by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="list-search-input"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="list-filter-select"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="ticket-grid">
        {filteredTickets.length === 0 ? (
          <p className="empty-message">
            No tickets found matching your criteria.
          </p>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <h3 className="ticket-title">{ticket.title}</h3>
                <div
                  className={`ticket-priority ${handlePriorityStyle(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </div>
              </div>

              <p className="ticket-description">{ticket.description}</p>

              <div className="ticket-meta">
                <span className="ticket-meta-item">
                  Status:
                  <select
                    value={ticket.status}
                    onChange={(e) =>
                      handleStatusChange(ticket.id, e.target.value)
                    }
                    className={`ticket-status-select ticket-status--${ticket.status
                      .replace(/\s+/g, "")
                      .toLowerCase()}`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </span>
                <span className="ticket-meta-item">
                  Created: {ticket.createdAt.toLocaleDateString()}
                </span>
              </div>

              <div className="ticket-actions">
                <button
                  onClick={() => setEditingTicket(ticket)}
                  className="ticket-btn--edit"
                  title="Edit Ticket"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDeleteClick(ticket.id)}
                  className="ticket-btn--delete"
                  title="Delete Ticket"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Main Ticket Management Component ---
const TicketManagement = () => {
  const navigate = useNavigate();
  const {
    tickets,
    addTicket,
    updateTicket,
    deleteTicket,
    userId,
    isAuthReady,
  } = useTicketData();

  // State for Modals and Editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  // Handlers for CRUD Operations
  const handleNewTicketSubmit = (data) => {
    addTicket(data);
    setIsFormOpen(false); // Close the form after submission
  };

  const handleEditTicketSubmit = (data) => {
    updateTicket(editingTicket.id, data);
    setEditingTicket(null); // Close editing mode
    setIsFormOpen(false);
  };

  // Handler to open the form for editing
  const handleStartEditing = (ticket) => {
    setEditingTicket(ticket);
    setIsFormOpen(true);
  };

  // Handler for Delete Confirmation
  const handleConfirmDeleteClick = (id) => {
    setTicketToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ticketToDelete) {
      deleteTicket(ticketToDelete);
    }
    setTicketToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleCancelDelete = () => {
    setTicketToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleLogout = () => {
    if (auth.currentUser) {
      auth.signOut(); // Firebase sign out
    }
    localStorage.removeItem("ticketapp_session"); // Mock session sign out
    navigate("/auth/login", { replace: true });
  };

  // Handle closing the form/modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTicket(null);
  };

  if (!isAuthReady) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Establishing secure connection...</p>
      </div>
    );
  }

  // Determine form state
  const formTitle = editingTicket ? "Edit Ticket" : "Create New Ticket";
  const formInitialData = editingTicket || {};
  const formSubmitHandler = editingTicket
    ? handleEditTicketSubmit
    : handleNewTicketSubmit;

  return (
    <div className="dashboard-layout">
      {/* Sidebar/Header */}
      <header className="dashboard-header">
        <div className="header-title-group">
          <Users size={28} className="header-icon" />
          <h1 className="header-title">Ticket Dashboard</h1>
        </div>

        <div className="header-actions">
          <span className="user-id-display" title="Your unique ID">
            User ID: {userId}
          </span>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Main Content Area */}
        <div className="dashboard-content">
          <div className="content-header">
            <h2>System Tickets ({tickets.length})</h2>
            <button
              type="button"
              onClick={() => {
                setEditingTicket(null);
                setIsFormOpen(true);
              }}
              className="btn-create-ticket"
            >
              <Plus size={20} />
              Create Ticket
            </button>
          </div>

          <TicketList
            tickets={tickets}
            updateTicket={updateTicket}
            onDeleteClick={handleConfirmDeleteClick}
            setEditingTicket={handleStartEditing}
          />
        </div>

        {/* Modals and Overlays */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          title="Confirm Deletion"
          message="Are you sure you want to permanently delete this ticket? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        {isFormOpen && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleCloseForm} className="modal-close-btn">
                &times;
              </button>
              <TicketForm
                isEditing={!!editingTicket}
                initialData={formInitialData}
                onSubmit={formSubmitHandler}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TicketManagement;
