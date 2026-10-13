import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  UserCog,
  X,
  Copy,
  Check,
} from "lucide-react";

import API_URL from "../../config";
import "./AdminSupportAgents.css";

export default function AdminSupportAgents() {
  const [agents, setAgents] = useState([]);
  const [specialization, setSpecialization] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [createdPassword, setCreatedPassword] = useState("");
  const [createdAgent, setCreatedAgent] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    specialization: "GENERAL",
  });

  const fetchAgents = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (specialization !== "ALL") {
        params.append("specialization", specialization);
      }

      const response = await fetch(
        `${API_URL}/admin/support-agents?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch support agents"
        );
      }

      setAgents(data.agents || []);
    } catch (error) {
      console.error("Fetch support agents error:", error);
      setError(
        error.message || "Unable to fetch support agents"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [specialization]);

  const formatSpecialization = (value) => {
    if (!value) return "—";

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setCreateError("");
  };

  const handleCreateAgent = async (event) => {
    event.preventDefault();

    setCreateError("");

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();

    if (!firstName || !lastName || !email) {
      setCreateError(
        "First name, last name and email are required."
      );
      return;
    }

    setCreating(true);

    try {
      const fullName = `${firstName} ${lastName}`;

      const response = await fetch(
        `${API_URL}/admin/support-agents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: fullName,
            email,
            specialization: formData.specialization,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCreateError(
          data.message || "Unable to create support agent."
        );
        return;
      }

      setCreatedAgent(data.agent);
      setCreatedPassword(data.initialPassword);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        specialization: "GENERAL",
      });

      await fetchAgents();
    } catch (error) {
      console.error("Create support agent error:", error);

      setCreateError(
        "Unable to connect to the server."
      );
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    setCreateError("");
    setCreatedPassword("");
    setCreatedAgent(null);
    setCopied(false);

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      specialization: "GENERAL",
    });
  };

  const copyPassword = async () => {
    if (!createdPassword) return;

    try {
      await navigator.clipboard.writeText(
        createdPassword
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy password error:", error);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return true;

    return (
      agent.name?.toLowerCase().includes(searchText) ||
      agent.email?.toLowerCase().includes(searchText)
    );
  });

  return (
    <>
      <div className="admin-support-agents-page">
        <div className="admin-support-agents-header">
          <div>
            <p className="admin-support-agents-eyebrow">
              SUPPORT MANAGEMENT
            </p>

            <h1>Support Agents</h1>

            <p className="admin-support-agents-description">
              Manage support agents and their specializations.
            </p>
          </div>

          <button
            type="button"
            className="admin-support-agents-create-button"
            onClick={() => {
              setCreateError("");
              setCreatedPassword("");
              setCreatedAgent(null);
              setShowCreateModal(true);
            }}
          >
            <Plus size={17} />
            Create Support Agent
          </button>
        </div>

        <div className="admin-support-agents-toolbar">
          <div className="admin-support-agents-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            className="admin-support-agents-filter"
            value={specialization}
            onChange={(event) =>
              setSpecialization(event.target.value)
            }
          >
            <option value="ALL">
              All Specializations
            </option>

            <option value="PAYMENT">Payment</option>
            <option value="SUBSCRIPTION">
              Subscription
            </option>
            <option value="ACCOUNT">Account</option>
            <option value="TECHNICAL">Technical</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        <div className="admin-support-agents-card">
          {loading ? (
            <div className="admin-support-agents-empty">
              Loading support agents...
            </div>
          ) : error ? (
            <div className="admin-support-agents-empty error">
              {error}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="admin-support-agents-empty">
              <UserCog size={28} />

              <p>No support agents found.</p>
            </div>
          ) : (
            <div className="admin-support-agents-table-wrapper">
              <table className="admin-support-agents-table">
                <thead>
                  <tr>
                    <th>AGENT</th>
                    <th>EMAIL</th>
                    <th>SPECIALIZATION</th>
                    <th>ASSIGNED TICKETS</th>
                    <th>CREATED</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div className="admin-support-agent-name">
                          <div className="admin-support-agent-avatar">
                            {agent.name
                              ?.slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <strong>{agent.name}</strong>
                        </div>
                      </td>

                      <td>{agent.email}</td>

                      <td>
                        <span className="admin-support-agent-specialization">
                          {formatSpecialization(
                            agent.supportSpecialization
                          )}
                        </span>
                      </td>

                      <td>
                        {agent.assignedTickets}
                      </td>

                      <td>
                        {new Date(
                          agent.createdAt
                        ).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE SUPPORT AGENT MODAL */}

      {showCreateModal && (
        <div
          className="admin-support-agent-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div
            className="admin-support-agent-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-support-agent-title"
          >
            {!createdAgent ? (
              <>
                <div className="admin-support-agent-modal-header">
                  <div>
                    <p className="admin-support-agent-modal-eyebrow">
                      SUPPORT MANAGEMENT
                    </p>

                    <h2 id="create-support-agent-title">
                      Create Support Agent
                    </h2>

                    <p>
                      Create a support account with a
                      predefined initial password.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-support-agent-modal-close"
                    onClick={closeCreateModal}
                    disabled={creating}
                    aria-label="Close"
                  >
                    <X size={19} />
                  </button>
                </div>

                <form
                  className="admin-support-agent-form"
                  onSubmit={handleCreateAgent}
                >
                  <div className="admin-support-agent-form-row">
                    <div className="admin-support-agent-field">
                      <label htmlFor="support-agent-first-name">
                        First Name
                      </label>

                      <input
                        id="support-agent-first-name"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleCreateChange}
                        placeholder="Enter first name"
                        disabled={creating}
                      />
                    </div>

                    <div className="admin-support-agent-field">
                      <label htmlFor="support-agent-last-name">
                        Last Name
                      </label>

                      <input
                        id="support-agent-last-name"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleCreateChange}
                        placeholder="Enter last name"
                        disabled={creating}
                      />
                    </div>
                  </div>

                  <div className="admin-support-agent-field">
                    <label htmlFor="support-agent-email">
                      Email
                    </label>

                    <input
                      id="support-agent-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleCreateChange}
                      placeholder="Enter email address"
                      disabled={creating}
                    />
                  </div>

                  <div className="admin-support-agent-field">
                    <label htmlFor="support-agent-specialization">
                      Specialization
                    </label>

                    <select
                      id="support-agent-specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleCreateChange}
                      disabled={creating}
                    >
                      <option value="PAYMENT">
                        Payment
                      </option>

                      <option value="SUBSCRIPTION">
                        Subscription
                      </option>

                      <option value="ACCOUNT">
                        Account
                      </option>

                      <option value="TECHNICAL">
                        Technical
                      </option>

                      <option value="GENERAL">
                        General
                      </option>
                    </select>
                  </div>

                  <div className="admin-support-agent-password-note">
                    <strong>Initial password</strong>

                    <span>
                      The password will automatically be
                      generated from the agent's first name.
                    </span>

                    <code>
                      FirstName@12345
                    </code>
                  </div>

                  {createError && (
                    <div className="admin-support-agent-form-error">
                      {createError}
                    </div>
                  )}

                  <div className="admin-support-agent-form-actions">
                    <button
                      type="button"
                      className="admin-support-agent-cancel-button"
                      onClick={closeCreateModal}
                      disabled={creating}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-support-agent-submit-button"
                      disabled={creating}
                    >
                      {creating
                        ? "Creating..."
                        : "Create Agent"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="admin-support-agent-success-icon">
                  <Check size={24} />
                </div>

                <div className="admin-support-agent-success-content">
                  <h2>
                    Support Agent Created
                  </h2>

                  <p>
                    {createdAgent.name} has been created
                    successfully.
                  </p>

                  <div className="admin-support-agent-credentials">
                    <div>
                      <span>Email</span>
                      <strong>
                        {createdAgent.email}
                      </strong>
                    </div>

                    <div>
                      <span>Initial Password</span>

                      <div className="admin-support-agent-password-row">
                        <code>
                          {createdPassword}
                        </code>

                        <button
                          type="button"
                          onClick={copyPassword}
                          className="admin-support-agent-copy-button"
                          title="Copy password"
                        >
                          {copied ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-support-agent-warning">
                    Provide this initial password to the
                    support agent. They should change it
                    from their profile after logging in.
                  </div>

                  <button
                    type="button"
                    className="admin-support-agent-submit-button admin-support-agent-done-button"
                    onClick={closeCreateModal}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}