
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, dailyRecordAPI, weeklyReportAPI } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const studentsRes = await studentAPI.getAll();
      setStudents(studentsRes.data);
      const pendingRes = await dailyRecordAPI.getPending();
      setPendingRecords(pendingRes.data);
      const reportsRes = await weeklyReportAPI.getAll();
      setReports(reportsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecord = async (id) => {
    try {
      await dailyRecordAPI.approve(id, user.id);
      fetchData();
    } catch (error) {
      console.error('Error approving record:', error);
    }
  };

  const handleApproveReport = async (id) => {
    try {
      await weeklyReportAPI.approve(id);
      fetchData();
    } catch (error) {
      console.error('Error approving report:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* Mobile Navigation Toggle */}
      <button 
        className={`mobile-nav-toggle ${mobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="nav-user">
          <div className="username">{user?.username}</div>
          <div className="role">{user?.role}</div>
        </div>
        <button className="btn" onClick={() => { window.history.back(); setMobileMenuOpen(false); }}>
          ← Back
        </button>
        <button className={`tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}>
          Students ({students.length})
        </button>
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); setMobileMenuOpen(false); }}>
          Pending ({pendingRecords.length})
        </button>
        <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}>
          Reports ({reports.length})
        </button>
        <button className="btn btn-primary" onClick={() => { logout(); setMobileMenuOpen(false); }}>
          Logout
        </button>
      </div>

      <nav className="navbar">
        <h1>OJT Hours</h1>
        <div className="navbar-right hide-mobile">
          <span className="role-badge">{user?.role}</span>
          <span className="welcome-text">{user?.username}</span>
          <button onClick={logout} className="btn logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Students ({students.length})
          </button>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingRecords.length})
          </button>
          <button
            className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports ({reports.length})
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="records-container">
            <div className="records-header">
              <h3>All Students</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Hours</th>
                  <th>Target</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 500 }}>{student.full_name}</td>
                    <td style={{ color: '#6b7280' }}>{student.student_id}</td>
                    <td>{student.department}</td>
                    <td style={{ fontWeight: 600 }}>{student.total_hours}</td>
                    <td>{student.target_hours}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="progress-bar-container" style={{ width: '100px', height: '8px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${Math.min((student.total_hours / student.target_hours) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '40px' }}>
                          {Math.min(((student.total_hours / student.target_hours) * 100).toFixed(0), 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="records-container">
            <div className="records-header">
              <h3>Pending Approvals</h3>
            </div>
            {pendingRecords.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Hours</th>
                      <th>Task</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{record.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.student_id}</div>
                        </td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.time_in}</td>
                        <td>{record.time_out}</td>
                        <td style={{ fontWeight: 600 }}>{parseFloat(record.hours_worked).toFixed(2)}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.task_description}
                        </td>
                        <td>
                          <button className="btn btn-success btn-sm" onClick={() => handleApproveRecord(record.id)}>
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No pending approvals</div>
            )}
          </div>
        )}

        {/* Weekly Reports Tab */}
        {activeTab === 'reports' && (
          <div className="records-container">
            <div className="records-header">
              <h3>Weekly Reports</h3>
            </div>
            {reports.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Week</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{report.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{report.student_id}</div>
                      </td>
                      <td>
                        {new Date(report.week_start_date).toLocaleDateString()} - {new Date(report.week_end_date).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{report.total_hours}</td>
                      <td>
                        <span className={`status-${report.status === 'approved' ? 'approved' : 'pending'}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        {report.status !== 'approved' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleApproveReport(report.id)}>
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No reports found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

