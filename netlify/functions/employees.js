'use strict';

// In-memory store for demo purposes only (resets on each cold start)
let employees = [
  { id: '1', name: 'Alice Johnson', role: 'Developer', email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', role: 'Designer', email: 'bob@example.com' }
];
let nextId = 3;

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return json(200, {});

  const { httpMethod, path } = event;
  const idMatch = (() => {
    // Support both direct function path and redirected clean path
    // e.g. '/.netlify/functions/employees/1' or '/employees/1'
    const m = /\/employees\/(.+)$/.exec(path);
    return m && m[1] ? m[1] : null;
  })();

  try {
    if (httpMethod === 'GET' && !idMatch) {
      return json(200, employees);
    }
    if (httpMethod === 'GET' && idMatch) {
      const emp = employees.find(e => e.id === idMatch);
      return emp ? json(200, emp) : json(404, { message: 'Not found' });
    }
    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const created = {
        id: String(nextId++),
        name: body.name || '',
        role: body.role || '',
        email: body.email || ''
      };
      employees.push(created);
      return json(201, created);
    }
    if (httpMethod === 'PUT' && idMatch) {
      const idx = employees.findIndex(e => e.id === idMatch);
      if (idx === -1) return json(404, { message: 'Not found' });
      const body = JSON.parse(event.body || '{}');
      employees[idx] = { id: idMatch, name: body.name || '', role: body.role || '', email: body.email || '' };
      return json(200, employees[idx]);
    }
    if (httpMethod === 'PATCH' && idMatch) {
      const idx = employees.findIndex(e => e.id === idMatch);
      if (idx === -1) return json(404, { message: 'Not found' });
      const body = JSON.parse(event.body || '{}');
      employees[idx] = { ...employees[idx], ...body, id: idMatch };
      return json(200, employees[idx]);
    }
    if (httpMethod === 'DELETE' && idMatch) {
      const existing = employees.some(e => e.id === idMatch);
      employees = employees.filter(e => e.id !== idMatch);
      return existing ? json(200, { message: 'Deleted' }) : json(404, { message: 'Not found' });
    }

    return json(405, { message: 'Method Not Allowed' });
  } catch (err) {
    return json(500, { message: 'Server error', error: String(err) });
  }
};


