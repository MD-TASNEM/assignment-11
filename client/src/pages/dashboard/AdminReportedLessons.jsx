import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../config/firebase";
import apiClient from "../../config/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function AdminReportedLessons() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem("authToken", token);
        await fetchReports();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading reports");
      }
    });

    return unsubscribe;
  }, [navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/reports/all-reports");
      setReports(response.data || []);
    } catch (error) {
      toast.error("Error fetching reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await apiClient.patch(`/reports/report/${reportId}`, {
        status: action === "delete" ? "resolved-deleted" : "resolved-ignored",
      });
      toast.success(
        `Report ${action === "delete" ? "resolved - lesson deleted" : "resolved - ignored"}`,
      );
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      toast.error("Error resolving report");
    }
  };

  const groupedReports = reports.reduce((acc, report) => {
    const lessonId = report.lessonId;
    if (!acc[lessonId]) {
      acc[lessonId] = {
        lessonId,
        lessonTitle: report.lessonTitle,
        creatorName: report.creatorName,
        reports: [],
        status: report.status,
      };
    }
    acc[lessonId].reports.push(report);
    return acc;
  }, {});

  const filteredGroups = Object.values(groupedReports).filter((group) => {
    return (
      statusFilter === "" ||
      (statusFilter === "pending" && group.status === "pending") ||
      (statusFilter === "resolved" && group.status !== "pending")
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Reported Lessons</h1>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No reported lessons</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.lessonId} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link
                    to={`/lesson/${group.lessonId}`}
                    className="text-2xl font-bold text-primary-color hover:underline"
                  >
                    {group.lessonTitle}
                  </Link>
                  <p className="text-gray-600">Creator: {group.creatorName}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      group.status === "pending"
                        ? "bg-red-200 text-red-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {group.status === "pending" ? "Pending" : "Resolved"}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedReport(
                        selectedReport === group.lessonId
                          ? null
                          : group.lessonId,
                      )
                    }
                    className="btn-outline text-xs"
                  >
                    {selectedReport === group.lessonId ? "Hide" : "Show"}{" "}
                    Reports ({group.reports.length})
                  </button>
                </div>
              </div>

              {selectedReport === group.lessonId && (
                <div className="border-t pt-4">
                  <div className="space-y-3 mb-4">
                    {group.reports.map((report, idx) => (
                      <div key={report._id} className="bg-light-bg p-3 rounded">
                        <p className="text-sm font-bold mb-1">
                          Report #{idx + 1}
                        </p>
                        <p className="text-sm">
                          <span className="font-bold">Reason:</span>{" "}
                          {report.reason}
                        </p>
                        <p className="text-sm">
                          <span className="font-bold">Reporter:</span>{" "}
                          {report.reporterName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {group.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleResolveReport(group.reports[0]._id, "delete")
                        }
                        className="btn-danger flex-1"
                      >
                        Delete Lesson
                      </button>
                      <button
                        onClick={() =>
                          handleResolveReport(group.reports[0]._id, "ignore")
                        }
                        className="btn-outline flex-1"
                      >
                        Ignore Reports
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
