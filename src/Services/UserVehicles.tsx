import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserVehicle {
  id: number;
  vehicle_type: string;
  plan_kind: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  created_at: string;
  last_used_at: string;
  removed_at: string | null;
  removed_by: string | null;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { authorization: `Bearer ${token}` } : {};
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const UserVehicles: React.FC = () => {
  const [email, setEmail] = useState("");
  const [foundEmail, setFoundEmail] = useState("");
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadVehicles = async (searchEmail: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}api/admin/user-vehicles?email=${encodeURIComponent(searchEmail)}`,
        { headers: authHeaders() }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not load vehicles");
      }
      setFoundEmail(data.user.email);
      setVehicles(data.vehicles);
    } catch (err) {
      setFoundEmail("");
      setVehicles([]);
      setError(err instanceof Error ? err.message : "Could not load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (email.trim()) {
      loadVehicles(email.trim());
    }
  };

  const handleRemove = async (vehicle: UserVehicle) => {
    const name = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    if (!window.confirm(`Remove ${name} from ${foundEmail}? This frees one vehicle slot.`)) {
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}api/admin/user-vehicles/${vehicle.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not remove the vehicle");
      }
      await loadVehicles(foundEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the vehicle");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">User Vehicles</h1>
      <p className="text-gray-600 mb-6">
        Find a user by email and remove an old vehicle so they can add a new one.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="User's email"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {foundEmail && vehicles.length === 0 && (
        <p className="text-gray-600">{foundEmail} has no counted vehicles.</p>
      )}

      {vehicles.length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="font-semibold text-gray-800 mb-2">{foundEmail}</h2>
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2 border-b">Vehicle</th>
                <th className="p-2 border-b">Type</th>
                <th className="p-2 border-b">Counted on</th>
                <th className="p-2 border-b">VIN</th>
                <th className="p-2 border-b">First used</th>
                <th className="p-2 border-b">Last used</th>
                <th className="p-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className={vehicle.removed_at ? "text-gray-400" : ""}>
                  <td className="p-2 border-b">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </td>
                  <td className="p-2 border-b">{vehicle.vehicle_type}</td>
                  <td className="p-2 border-b">{vehicle.plan_kind === "trial" ? "Free trial" : "Paid plan"}</td>
                  <td className="p-2 border-b">{vehicle.vin ?? "Not read"}</td>
                  <td className="p-2 border-b">{formatDate(vehicle.created_at)}</td>
                  <td className="p-2 border-b">{formatDate(vehicle.last_used_at)}</td>
                  <td className="p-2 border-b">
                    {vehicle.removed_at ? (
                      `Removed ${formatDate(vehicle.removed_at)} by ${vehicle.removed_by ?? "unknown"}`
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemove(vehicle)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserVehicles;
