import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { weeklyReportAPI, studentAPI } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const WeeklyReportPrint = () => {
  const { user, logout } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (user?.studentProfile) {
        setStudentProfile(user.studentProfile);
      } else {
        const profileRes = await studentAPI.getByUserId(user.id);
        setStudentProfile(profileRes.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    setWeekStartDate(startDate);
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 4);
      setWeekEndDate(end.toISOString().split('T')[0]);
    }
  };

  const fetchReport = async () => {
    if (!weekStartDate || !weekEndDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (!studentProfile?.id) {
      setError('Student profile not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await weeklyReportAPI.getForPrint(
        studentProfile.id,
        weekStartDate,
        weekEndDate
      );
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load weekly report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Try to get logo from the DOM element that's already displayed
    const logoImg = document.querySelector('.printable-report .school-logo .logo-img');
    
    // Use setTimeout to ensure image is fully loaded
    setTimeout(() => {
      if (logoImg && logoImg.src && logoImg.complete) {
        try {
          // Get natural dimensions to maintain aspect ratio
          const imgWidth = logoImg.naturalWidth || 80;
          const imgHeight = logoImg.naturalHeight || 60;
          const ratio = imgHeight / imgWidth;
          const pdfWidth = 20; // width in mm
          const pdfHeight = pdfWidth * ratio; // maintain aspect ratio
          doc.addImage(logoImg.src, 'PNG', 95, 8, pdfWidth, pdfHeight);
        } catch (e) {
          console.log('Could not add logo from DOM:', e);
        }
      }
      generatePDFContent(doc);
    }, 100);
  };

  const generatePDFContent = (doc) => {
    // School name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Saint Francis Institute of Computer Studies', 105, 40, { align: 'center' });

    // Report title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKLY ACTIVITY REPORT', 105, 48, { align: 'center' });

    // Week range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Week: ' + formatDateRange(), 105, 55, { align: 'center' });

    // Student info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.student.name, 45, 70);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Student No.:', 110, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.student.studentId, 140, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Department:', 20, 77);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.student.department, 45, 77);

    // Prepare table data
    const tableData = [];
    reportData.days.forEach((day) => {
      if (day.records.length > 0) {
        day.records.forEach((record) => {
          const row = [
            day.day + ' ' + formatDisplayDate(day.date),
            record.time_in + ' - ' + record.time_out + ' (' + parseFloat(record.hours_worked).toFixed(1) + ' hrs)',
            record.task_description
          ];
          tableData.push(row);
        });
      } else {
        const row = [
          day.day + ' ' + formatDisplayDate(day.date),
          '-',
          'No record'
        ];
        tableData.push(row);
      }
    });

    // Add total row
    tableData.push([
      { content: 'Total Hours for the Week:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: reportData.totalHours + ' hours', styles: { fontStyle: 'bold', textColor: [22, 163, 74] } }
    ]);

    // Generate table
    doc.autoTable({
      startY: 85,
      head: [['Day', 'Time', 'Task / Activity']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 45 },
        2: { cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Add signature section
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Signature', 20, finalY);
    
    doc.setLineWidth(0.5);
    doc.line(20, finalY + 12, 80, finalY + 12);

    // Save PDF
    doc.save('Weekly_Report_' + formatDateRange().replace(/ /g, '_') + '.pdf');
  };

  const formatDateRange = () => {
    if (!reportData) return '';
    const start = new Date(reportData.weekStartDate);
    const end = new Date(reportData.weekEndDate);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return start.toLocaleDateString('en-US', options) + ' - ' + end.toLocaleDateString('en-US', options);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return month + '/' + day + '/' + year;
  };

  return (
    React.createElement('div', { className: 'weekly-report-print' },
      /* Mobile Navigation Toggle */
      React.createElement('button', { 
        className: 'mobile-nav-toggle ' + (mobileMenuOpen ? 'active' : ''), 
        onClick: () => setMobileMenuOpen(!mobileMenuOpen),
        'aria-label': 'Toggle navigation menu'
      },
        React.createElement('span'),
        React.createElement('span'),
        React.createElement('span')
      ),

      /* Mobile Navigation Menu */
      React.createElement('div', { className: 'mobile-nav-menu ' + (mobileMenuOpen ? 'active' : '') },
        React.createElement('div', { className: 'nav-user' },
          React.createElement('div', { className: 'username' }, user?.username),
          React.createElement('div', { className: 'role' }, 'Student')
        ),
        React.createElement('button', { className: 'btn', onClick: () => { window.history.back(); setMobileMenuOpen(false); } },
          'Back'
        ),
        React.createElement('button', { className: 'btn btn-primary', onClick: () => { logout(); setMobileMenuOpen(false); } },
          'Logout'
        )
      ),

      React.createElement('nav', { className: 'navbar' },
        React.createElement('h1', null, 'Weekly Report'),
        React.createElement('div', { className: 'navbar-right hide-mobile' },
          React.createElement('button', { onClick: () => window.history.back(), className: 'btn', style: { marginRight: '10px' } }, 'Back'),
          React.createElement('button', { onClick: logout, className: 'btn logout-btn' }, 'Logout')
        )
      ),
      React.createElement('div', { className: 'weekly-report-controls no-print' },
        React.createElement('div', { className: 'control-group' },
          React.createElement('label', null, 'Week Starting (Monday):'),
          React.createElement('input', { type: 'date', value: weekStartDate, onChange: handleStartDateChange })
        ),
        React.createElement('div', { className: 'control-group' },
          React.createElement('label', null, 'Week Ending (Friday):'),
          React.createElement('input', { type: 'date', value: weekEndDate, onChange: (e) => setWeekEndDate(e.target.value) })
        ),
        React.createElement('button', { className: 'btn btn-primary', onClick: fetchReport, disabled: loading }, loading ? 'Loading...' : 'Load Report'),
        reportData && React.createElement('button', { className: 'btn btn-primary', onClick: handleDownloadPDF }, 'Download PDF'),
        reportData && React.createElement('button', { className: 'btn', onClick: handlePrint }, 'Print')
      ),
      error && React.createElement('div', { className: 'alert alert-error' }, error),
      reportData && React.createElement('div', { className: 'printable-report' },
        React.createElement('div', { className: 'report-header' },
          React.createElement('div', { className: 'school-logo' },
            React.createElement('img', { src: '/logo_2.png', alt: 'School Logo', className: 'logo-img' })
          ),
          React.createElement('div', { className: 'school-name' }, 'Saint Francis Institute of Computer Studies'),
          React.createElement('div', { className: 'report-title' }, 'WEEKLY ACTIVITY REPORT'),
          React.createElement('div', { className: 'report-week' }, 'Week: ' + formatDateRange())
        ),
        React.createElement('div', { className: 'student-info' },
          React.createElement('div', { className: 'info-row' },
            React.createElement('span', { className: 'info-label' }, 'Name:'),
            React.createElement('span', { className: 'info-value' }, reportData.student.name)
          ),
          React.createElement('div', { className: 'info-row' },
            React.createElement('span', { className: 'info-label' }, 'Student No.:'),
            React.createElement('span', { className: 'info-value' }, reportData.student.studentId)
          ),
          React.createElement('div', { className: 'info-row' },
            React.createElement('span', { className: 'info-label' }, 'Department:'),
            React.createElement('span', { className: 'info-value' }, reportData.student.department)
          )
        ),
        React.createElement('table', { className: 'report-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', { className: 'col-day' }, 'Day'),
              React.createElement('th', { className: 'col-time' }, 'Time'),
              React.createElement('th', { className: 'col-task' }, 'Task / Activity')
            )
          ),
          React.createElement('tbody', null,
            reportData.days.map((day, index) => 
              day.records.length > 0 
                ? day.records.map((record, rIndex) =>
                    React.createElement('tr', { key: index + '-' + rIndex },
                      rIndex === 0 && React.createElement('td', { className: 'day-cell', rowSpan: day.records.length },
                        React.createElement('div', { className: 'day-name' }, day.day),
                        React.createElement('div', { className: 'day-date' }, formatDisplayDate(day.date))
                      ),
                      React.createElement('td', { className: 'time-cell' }, record.time_in + ' - ' + record.time_out,
                        React.createElement('span', { className: 'hours-badge' }, '(' + parseFloat(record.hours_worked).toFixed(1) + ' hrs)')
                      ),
                      React.createElement('td', { className: 'task-cell' }, record.task_description)
                    )
                  )
                : React.createElement('tr', { key: index },
                    React.createElement('td', { className: 'day-cell' },
                      React.createElement('div', { className: 'day-name' }, day.day),
                      React.createElement('div', { className: 'day-date' }, formatDisplayDate(day.date))
                    ),
                    React.createElement('td', { className: 'time-cell' }, '-'),
                    React.createElement('td', { className: 'task-cell no-record' }, 'No record')
                  )
            ),
            React.createElement('tr', { className: 'total-row' },
              React.createElement('td', { colSpan: 2, className: 'total-label' }, 'Total Hours for the Week:'),
              React.createElement('td', { className: 'total-value' }, reportData.totalHours + ' hours')
            )
          )
        ),
        React.createElement('div', { className: 'report-footer' },
          React.createElement('div', { className: 'signature-box', style: { margin: '0 auto' } },
            React.createElement('div', { className: 'signature-line' }, 'Student Signature'),
            React.createElement('div', { className: 'signature-placeholder' })
          )
        )
      )
    )
  );
};

export default WeeklyReportPrint;

