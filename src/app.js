const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let employees = [
  { id: 'E001', name: 'Jaswanth Reddy', email: 'jaswanth@company.com', password: 'jaswanth123', role: 'employee', department: 'Engineering', leaveBalance: { casual: 8, sick: 6, earned: 12 } },
  { id: 'E002', name: 'Keerthana',      email: 'keerthana@company.com', password: 'keerthana123', role: 'employee', department: 'Engineering', leaveBalance: { casual: 6, sick: 6, earned: 10 } },
  { id: 'E003', name: 'Manoj',          email: 'manoj@company.com',     password: 'manoj123', role: 'employee', department: 'Engineering', leaveBalance: { casual: 10, sick: 5, earned: 14 } },
  { id: 'M001', name: 'Spadana',        email: 'spadana@company.com',   password: 'spadana123', role: 'manager',  department: 'Engineering', leaveBalance: { casual: 10, sick: 8, earned: 15 } },
];

let leaves = [
  { id: 'L001', employeeId: 'E001', employeeName: 'Jaswanth Reddy', department: 'Engineering', type: 'casual', fromDate: '2026-05-10', toDate: '2026-05-11', days: 2, reason: 'Family function',    status: 'pending',  appliedOn: '2026-05-01', managerId: 'M001' },
  { id: 'L002', employeeId: 'E002', employeeName: 'Keerthana',      department: 'Engineering', type: 'sick',   fromDate: '2026-04-20', toDate: '2026-04-21', days: 2, reason: 'Fever and cold',     status: 'approved', appliedOn: '2026-04-18', managerId: 'M001', actionOn: '2026-04-19', comment: 'Get well soon!' },
  { id: 'L003', employeeId: 'E003', employeeName: 'Manoj',          department: 'Engineering', type: 'earned', fromDate: '2026-04-25', toDate: '2026-04-27', days: 3, reason: 'Vacation trip',     status: 'rejected', appliedOn: '2026-04-20', managerId: 'M001', actionOn: '2026-04-21', comment: 'Critical deadline period' },
];
let nextLeaveId = 6;

function calcDays(from, to) {
  return Math.floor((new Date(to) - new Date(from)) / 86400000) + 1;
}

app.get('/api/employees', (req, res) => res.json(employees));
app.get('/api/employees/:id', (req, res) => {
  const emp = employees.find(e => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

app.get('/api/leaves', (req, res) => {
  const { employeeId, status, role, managerId } = req.query;
  let result = [...leaves];
  if (employeeId) result = result.filter(l => l.employeeId === employeeId);
  if (status)     result = result.filter(l => l.status === status);
  if (role === 'manager' && managerId) result = result.filter(l => l.managerId === managerId);
  res.json(result);
});

app.post('/api/leaves', (req, res) => {
  const { employeeId, type, fromDate, toDate, reason } = req.body;
  if (!employeeId || !type || !fromDate || !toDate || !reason)
    return res.status(400).json({ error: 'All fields required' });
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const days = calcDays(fromDate, toDate);
  if (emp.leaveBalance[type] < days)
    return res.status(400).json({ error: `Insufficient ${type} leave balance` });
  const manager = employees.find(e => e.role === 'manager' && e.department === emp.department)
                || employees.find(e => e.role === 'manager');
  const newLeave = {
    id: `L00${nextLeaveId++}`, employeeId, employeeName: emp.name,
    department: emp.department, type, fromDate, toDate, days, reason,
    status: 'pending', appliedOn: new Date().toISOString().split('T')[0],
    managerId: manager?.id || 'M001',
  };
  leaves.push(newLeave);
  res.status(201).json(newLeave);
});

app.put('/api/leaves/:id/action', (req, res) => {
  const { action, comment } = req.body;
  const leave = leaves.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if (leave.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
  leave.status = action === 'approve' ? 'approved' : 'rejected';
  leave.comment = comment || '';
  leave.actionOn = new Date().toISOString().split('T')[0];
  if (leave.status === 'approved') {
    const emp = employees.find(e => e.id === leave.employeeId);
    if (emp) emp.leaveBalance[leave.type] -= leave.days;
  }
  res.json(leave);
});

app.put('/api/leaves/:id/cancel', (req, res) => {
  const leave = leaves.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if (leave.status !== 'pending') return res.status(400).json({ error: 'Only pending leaves can be cancelled' });
  leave.status = 'cancelled';
  res.json(leave);
});

app.get('/api/stats', (req, res) => {
  const { role, id } = req.query;
  const scope = role === 'manager'
    ? leaves.filter(l => l.managerId === id)
    : leaves.filter(l => l.employeeId === id);
  res.json({
    total: scope.length,
    pending: scope.filter(l => l.status === 'pending').length,
    approved: scope.filter(l => l.status === 'approved').length,
    rejected: scope.filter(l => l.status === 'rejected').length,
  });
});

app.get('/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Leave Manager running on port ${PORT}`));
module.exports = app;
