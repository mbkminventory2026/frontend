const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ user_id: 3, role_name: 'ADMIN_KEUANGAN', permissions: ['PO_CLIENT_READ', 'ALL_ACCESS'] }, 'supersecretkey');

axios.get('http://localhost:8080/api/v1/po-clients', {
  headers: {
    Authorization: `Bearer ${token}`
  }
}).then(res => {
  console.log(JSON.stringify(res.data, null, 2));
}).catch(err => {
  console.error(err.response ? err.response.data : err.message);
});
