import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Firestore Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  addDoc,
  serverTimestamp,
  setLogLevel,
} from "firebase/firestore";
import {
  Plus,
  List,
  Trash2,
  Edit2,
  LogOut,
  Loader,
  X,
  AlertTriangle,
} from "lucide-react"; // Icons

// --- FIREBASE AND AUTH SETUP ---
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Set Firestore log levelz (helpful for debugging in the console)
setLogLevel("debug");

// Utility to create the path for the user's private ticket collection
const getTicketsCollectionRef = (userId) => {
  return collection(db, "artifacts", appId, "users", userId, "tickets");
};

// --- COMPONENTS ---

// 1. Ticket Form Modal (Create and Update)
const TicketModal = ({ ticket, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: ticket?.title || "",
    description: ticket?.description || "",
    priority: ticket?.priority || "Medium",
    status: ticket?.status || "Open",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isNew = !ticket?.id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Title and Description are required."); // Using custom UI instead of alert()
      return;
    }

    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
    onClose();
  };

  const priorityClasses = {
    High: "bg-red-500 text-white",
    Medium: "bg-yellow-500 text-gray-800",
    Low: "bg-green-500 text-white",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-6 bg-white rounded-xl shadow-2xl transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {isNew ? "Create New Ticket" : `Edit Ticket: ${ticket.title}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-full transition duration-150"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Database connection failure"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Detailed steps to reproduce the issue..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none"
              disabled={isLoading}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ${
                  priorityClasses[formData.priority]
                }`}
                disabled={isLoading}
              >
                <option value="High" className="bg-white text-red-500">
                  High
                </option>
                <option value="Medium" className="bg-white text-yellow-500">
                  Medium
                </option>
                <option value="Low" className="bg-white text-green-500">
                  Low
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                disabled={isLoading}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 disabled:bg-blue-400 flex items-center"
            disabled={isLoading}
          >
            {isLoading && <Loader size={16} className="animate-spin mr-2" />}
            {isNew ? "Create Ticket" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Individual Ticket Card
const TicketCard = ({ ticket, onEdit, onDelete }) => {
  const priorityClasses = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  const statusClasses = {
    Open: "bg-blue-100 text-blue-700",
    "In Progress": "bg-indigo-100 text-indigo-700",
    Closed: "bg-gray-100 text-gray-700",
  };

  // Format date only if available
  const dateCreated = ticket.createdAt?.toDate
    ? ticket.createdAt.toDate().toLocaleDateString()
    : "N/A";
  const timeCreated = ticket.createdAt?.toDate
    ? ticket.createdAt.toDate().toLocaleTimeString()
    : "";

  return (
    <div className="bg-white p-5 border-l-4 border-blue-600 shadow-lg rounded-lg hover:shadow-xl transition duration-300 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-800 break-words pr-4">
          {ticket.title}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(ticket)}
            className="p-2 text-blue-600 rounded-full hover:bg-blue-100 transition duration-150"
            title="Edit Ticket"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(ticket.id)}
            className="p-2 text-red-600 rounded-full hover:bg-red-100 transition duration-150"
            title="Delete Ticket"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-4 text-sm line-clamp-2">
        {ticket.description}
      </p>

      <div className="space-y-2 mt-auto">
        <div className="flex flex-wrap gap-2">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              priorityClasses[ticket.priority] || "bg-gray-200 text-gray-800"
            }`}
          >
            Priority: {ticket.priority}
          </span>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              statusClasses[ticket.status] || "bg-gray-200 text-gray-800"
            }`}
          >
            Status: {ticket.status}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Created: {dateCreated} {timeCreated}
        </p>
      </div>
    </div>
  );
};

// 3. Main Ticket Management Component
const TicketManagement = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [collectionStatus, setCollectionStatus] = useState(false); // true if collection has items

  // --- Auth and Firebase Initialization ---
  useEffect(() => {
    // 1. Attempt Sign-In
    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e);
      }
    };
    authenticate();

    // 2. Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Fallback to anonymous or sign-out if token expires
        if (!initialAuthToken) {
          signInAnonymously(auth);
        } else {
          // If a custom token fails, force sign out and redirect
          signOut(auth).then(() => navigate("/auth/login", { replace: true }));
        }
      }
      setIsAuthReady(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // --- Real-time Data Fetching (READ) ---
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    // Define the collection reference
    const ticketsCollectionRef = getTicketsCollectionRef(userId);

    // Set up the real-time listener
    const unsubscribe = onSnapshot(
      ticketsCollectionRef,
      (snapshot) => {
        const ticketList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTickets(ticketList);
        setCollectionStatus(ticketList.length > 0);
        setError(null);
      },
      (err) => {
        console.error("Firestore Fetch Error:", err);
        setError("Failed to load tickets. Check console for details.");
      }
    );

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [isAuthReady, userId]);

  // --- CRUD Operations ---

  // CREATE / UPDATE
  const handleSaveTicket = useCallback(
    async (ticketData) => {
      if (!userId) return;
      const ticketsCollectionRef = getTicketsCollectionRef(userId);

      try {
        const dataToSave = {
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
          status: ticketData.status,
        };

        if (editingTicket) {
          // UPDATE: Update existing document
          const ticketDocRef = doc(ticketsCollectionRef, editingTicket.id);
          // Use setDoc(docRef, data, { merge: true }) or updateDoc()
          await setDoc(
            ticketDocRef,
            { ...dataToSave, updatedAt: serverTimestamp() },
            { merge: true }
          );
          console.log("Ticket updated successfully:", editingTicket.id);
        } else {
          // CREATE: Add new document
          await addDoc(ticketsCollectionRef, {
            ...dataToSave,
            createdAt: serverTimestamp(),
          });
          console.log("Ticket created successfully.");
        }
      } catch (e) {
        console.error("Error saving ticket:", e);
        setError(`Failed to save ticket: ${e.message}`);
      } finally {
        setEditingTicket(null);
      }
    },
    [userId, editingTicket]
  );

  // DELETE
  const handleDeleteTicket = useCallback(
    async (id) => {
      if (!userId) return;

      // Use a custom confirmation message box instead of confirm()
      const isConfirmed = window.confirm(
        "Are you sure you want to delete this ticket?"
      );
      if (!isConfirmed) return;

      try {
        const ticketsCollectionRef = getTicketsCollectionRef(userId);
        await deleteDoc(doc(ticketsCollectionRef, id));
        console.log("Ticket deleted successfully:", id);
      } catch (e) {
        console.error("Error deleting ticket:", e);
        setError(`Failed to delete ticket: ${e.message}`);
      }
    },
    [userId]
  );

  // --- UI Handlers ---
  const openCreateModal = () => {
    setEditingTicket(null); // Clear any previous editing state
    setIsModalOpen(true);
  };

  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTicket(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("ticketapp_session");
    signOut(auth).then(() => navigate("/", { replace: true }));
  };

  if (isLoading || !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center text-xl font-medium text-gray-600">
          <Loader size={24} className="animate-spin mr-3 text-blue-500" />
          Connecting to Firebase...
        </div>
      </div>
    );
  }

  // Sort tickets: Open first, then by High Priority
  const sortedTickets = [...tickets].sort((a, b) => {
    if (a.status === "Open" && b.status !== "Open") return -1;
    if (a.status !== "Open" && b.status === "Open") return 1;

    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center">
            <List size={30} className="mr-3 text-blue-600" />
            Ticket Manager
          </h1>
          <div className="mt-4 sm:mt-0 flex space-x-3 items-center">
            <span className="text-sm text-gray-500 hidden md:block">
              User ID:{" "}
              <code className="text-xs font-mono bg-gray-200 px-2 py-1 rounded-md">
                {userId || "N/A"}
              </code>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 flex items-center"
            >
              <LogOut size={16} className="mr-1" />
              Logout
            </button>
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {tickets.length} total ticket{tickets.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-[1.02] flex items-center"
          >
            <Plus size={20} className="mr-2" />
            New Ticket
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-3" />
            {error}
          </div>
        )}

        {/* Ticket Grid */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-3">
            Ticket List
          </h2>

          {collectionStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTicket}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <List size={40} className="mx-auto mb-4 text-blue-300" />
              <p className="text-xl font-semibold mb-2">No tickets found.</p>
              <p>Click "New Ticket" to create your first item.</p>
            </div>
          )}
        </div>

        {/* Modal for CRUD Operations */}
        {isModalOpen && (
          <TicketModal
            ticket={editingTicket}
            onClose={closeModal}
            onSave={handleSaveTicket}
          />
        )}
      </div>
    </div>
  );
};

export default TicketManagement;
