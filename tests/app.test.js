const request = require('supertest');
const app = require('../src/app');

describe('Leave Management API', () => {
  test('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET /api/employees returns list', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/employees/:id returns employee', async () => {
    const res = await request(app).get('/api/employees/E001');
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Jaswanth Reddy');
  });

  test('GET /api/employees/:id returns 404 for unknown', async () => {
    const res = await request(app).get('/api/employees/X999');
    expect(res.statusCode).toBe(404);
  });

  test('GET /api/leaves returns all leaves', async () => {
    const res = await request(app).get('/api/leaves');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/leaves creates a leave request', async () => {
    const res = await request(app).post('/api/leaves').send({
      employeeId: 'E001',
      type: 'casual',
      fromDate: '2026-06-01',
      toDate: '2026-06-01',
      reason: 'Personal work'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  test('POST /api/leaves fails without required fields', async () => {
    const res = await request(app).post('/api/leaves').send({ employeeId: 'E001' });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /api/leaves/:id/action approves leave', async () => {
    const res = await request(app).put('/api/leaves/L001/action').send({
      action: 'approve', comment: 'Approved!'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  test('GET /api/stats returns stats', async () => {
    const res = await request(app).get('/api/stats?role=employee&id=E001');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pending');
  });
});
