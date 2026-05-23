import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaBuilding,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaSearch,
  FaCopy
} from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout";

interface Restaurant {
  _id: string;
  name: string;
  siteCode: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  orderCount?: number;
}

const SuperAdminDashboard: React.FC = () => {

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const getToken = () =>
    localStorage.getItem("adminToken") || localStorage.getItem("token");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const filtered = restaurants.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  }, [search, restaurants]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const token = getToken();

      const res = await fetch(
        "https://restom-backend-2.onrender.com/api/superadmin/restaurants",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setRestaurants(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (siteCode: string) => {

    const url = `${window.location.origin}/${siteCode}`;

    navigator.clipboard.writeText(url);

    alert("Restaurant link copied!");

  };

  const toggleStatus = async (siteCode: string, status: string) => {

    const newStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {

      const token = getToken();

      await fetch(
        `https://restom-backend-2.onrender.com/api/superadmin/restaurants/${siteCode}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      fetchRestaurants();

    } catch (err) {
      console.error(err);
    }

  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <AdminLayout title="Super Admin Dashboard">

      <div className="container-fluid py-4">

        {/* HEADER */}

        <div className="card border-0 shadow-sm mb-4" style={{borderRadius:16}}>
          <div className="card-body d-flex justify-content-between">

            <div>
              <h4 className="fw-bold">Restom Platform Control 👑</h4>
              <p className="text-muted mb-0">
                Manage restaurants and monitor your platform
              </p>
            </div>

            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <FaPlus /> Add Restaurant
            </button>

          </div>
        </div>


        {/* STATS */}

        <div className="row mb-4">

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Restaurants</p>
                  <h4 className="fw-bold">{restaurants.length}</h4>
                </div>
                <FaBuilding size={28} color="#6366F1" />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Active</p>
                  <h4 className="fw-bold">
                    {restaurants.filter((r) => r.status === "ACTIVE").length}
                  </h4>
                </div>
                <FaCheck size={28} color="green" />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Inactive</p>
                  <h4 className="fw-bold">
                    {restaurants.filter((r) => r.status !== "ACTIVE").length}
                  </h4>
                </div>
                <FaTimes size={28} color="red" />
              </div>
            </div>
          </div>

        </div>


        {/* SEARCH */}

        <div className="mb-3">

          <div className="input-group" style={{maxWidth:350}}>

            <span className="input-group-text">
              <FaSearch />
            </span>

            <input
              className="form-control"
              placeholder="Search restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>


        {/* TABLE */}

        <div className="card border-0 shadow-sm">

          {loading ? (

            <div className="text-center py-5">
              <FaSpinner className="fa-spin" size={28} />
            </div>

          ) : (

            <div className="table-responsive">

              <table className="table table-hover align-middle">

                <thead className="table-light">

                  <tr>
                    <th>Restaurant</th>
                    <th>Site Code</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredRestaurants.map((r) => (

                    <tr key={r._id}>

                      <td className="fw-semibold">{r.name}</td>

                      <td>
                        <code>{r.siteCode}</code>
                      </td>

                      <td>{r.email}</td>

                      <td>
                        <span
                          className={`badge ${
                            r.status === "ACTIVE"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td>{formatDate(r.createdAt)}</td>

                      <td>

                        <div className="d-flex gap-2">

                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => copyLink(r.siteCode)}
                          >
                            <FaCopy />
                          </button>

                          <button
                            className={`btn btn-sm ${
                              r.status === "ACTIVE"
                                ? "btn-outline-danger"
                                : "btn-outline-success"
                            }`}
                            onClick={() =>
                              toggleStatus(r.siteCode, r.status)
                            }
                          >
                            {r.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* SIMPLE MODAL */}

        {showModal && (

          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: "rgba(0,0,0,0.5)", zIndex: 999 }}
          >

            <div className="card p-4" style={{ width: 500 }}>

              <h5 className="fw-bold mb-3">Create Restaurant</h5>

              <p className="text-muted">
                Use the existing form you already created.
              </p>

              <button
                className="btn btn-secondary mt-3"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>

            </div>

          </div>

        )}

      </div>

    </AdminLayout>
  );
};

export default SuperAdminDashboard;