const ExcelTemplate = require('../models/ExcelTemplate');
const DailyRecord = require('../models/DailyRecord');
const XLSX = require('xlsx');

const excelController = {
  // Upload and save Excel template
  async uploadTemplate(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const studentId = req.body.studentId;
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      // Read the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get column headers from first row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const columnHeaders = jsonData[0] || [];

      // Get original filename as template name
      const templateName = req.file.originalname;

      // Save template to database
      await ExcelTemplate.create(studentId, templateName, columnHeaders);

      res.json({
        message: 'Excel template uploaded successfully',
        templateName: templateName,
        columnHeaders: columnHeaders
      });
    } catch (error) {
      console.error('Upload template error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  // Get student's saved template
  async getTemplate(req, res) {
    try {
      const studentId = req.params.studentId;
      const template = await ExcelTemplate.findByStudentId(studentId);

      if (!template) {
        return res.json({ 
          hasTemplate: false, 
          message: 'No template found' 
        });
      }

      res.json({
        hasTemplate: true,
        template: template
      });
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Parse Excel file and return data for preview/import
  async parseExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Read the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get all data as JSON (array of arrays for full structure)
      const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const columnHeaders = dataWithHeaders[0] || [];
      const rows = dataWithHeaders.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

      res.json({
        columnHeaders: columnHeaders,
        rows: rows,
        totalRows: rows.length
      });
    } catch (error) {
      console.error('Parse Excel error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  // Import records from parsed Excel data
  async importRecords(req, res) {
    try {
      const { studentId, records } = req.body;

      if (!studentId || !records || !Array.isArray(records)) {
        return res.status(400).json({ message: 'Invalid data' });
      }

      const importedRecords = [];
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          // Try to extract data from the record (supports various column layouts)
          const date = record.date || record.Date || record.DATE;
          const timeIn = record.time_in || record.timeIn || record['Time In'] || record['time in'] || record['TIME IN'];
          const timeOut = record.time_out || record.timeOut || record['Time Out'] || record['time out'] || record['TIME OUT'];
          const taskDescription = record.task_description || record.taskDescription || record['Task Description'] || record['task description'] || record['TASK DESCRIPTION'];

          if (date && timeIn && timeOut) {
            const result = await DailyRecord.create(studentId, date, timeIn, timeOut, taskDescription || '');
            importedRecords.push({ row: i + 1, id: result.insertId });
          } else {
            errors.push({ row: i + 1, message: 'Missing required fields (date, time_in, time_out)' });
          }
        } catch (err) {
          errors.push({ row: i + 1, message: err.message });
        }
      }

      res.json({
        message: 'Import completed',
        importedCount: importedRecords.length,
        importedRecords: importedRecords,
        errors: errors
      });
    } catch (error) {
      console.error('Import records error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  // Get preview data in the same template format
  async getPreview(req, res) {
    try {
      const studentId = req.params.studentId;
      
      // Get student's daily records
      const records = await DailyRecord.findByStudentId(studentId);
      
      // Get student's template (if any)
      let template = null;
      try {
        template = await ExcelTemplate.findByStudentId(studentId);
      } catch (templateError) {
        console.log('Error fetching template:', templateError);
        // Continue without template
      }

      // Format records for display
      const formattedRecords = records.map(record => ({
        date: record.date,
        time_in: record.time_in,
        time_out: record.time_out,
        hours_worked: record.hours_worked,
        task_description: record.task_description,
        supervisor_approval: record.supervisor_approval
      }));

      res.json({
        hasTemplate: !!template,
        template: template,
        records: formattedRecords,
        totalRecords: formattedRecords.length
      });
    } catch (error) {
      console.error('Get preview error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Export records to Excel timesheet format
  async exportTimesheet(req, res) {
    try {
      const studentId = req.params.studentId;
      const { startDate, endDate } = req.query;
      
      let records;
      if (startDate && endDate) {
        records = await DailyRecord.getByDateRange(studentId, startDate, endDate);
      } else {
        records = await DailyRecord.findByStudentId(studentId);
      }
      
      // Group records by date
      const recordsByDate = {};
      records.forEach(record => {
        const date = new Date(record.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'numeric', 
          day: 'numeric', 
          year: 'numeric' 
        });
        if (!recordsByDate[date]) {
          recordsByDate[date] = [];
        }
        recordsByDate[date].push(record);
      });
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create header row
      const wsData = [['DATE', 'TASK']];
      
      // Add records grouped by date
      Object.keys(recordsByDate).forEach(date => {
        wsData.push([date, '']); // Date header
        recordsByDate[date].forEach(record => {
          const timeRange = `${record.time_in} - ${record.time_out}`;
          wsData.push([timeRange, record.task_description || '']);
        });
        wsData.push(['', '']); // Empty row between dates
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [{ wch: 20 }, { wch: 50 }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=weekly-report.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  }
};

module.exports = excelController;

