const apiService = require("../services/apiService");

async function createApi(req, res) {
  const api = await apiService.createApi(req.body, req.auth);
  res.status(201).json({
    api,
  });
}

async function listApis(req, res) {
  const apis = await apiService.listApis(req.auth);
  res.status(200).json({
    items: apis,
  });
}

async function getApi(req, res) {
  const api = await apiService.getApi(req.params.apiId, req.auth);
  res.status(200).json({
    api,
  });
}

async function updateApi(req, res) {
  const api = await apiService.updateApi(req.params.apiId, req.body, req.auth);
  res.status(200).json({
    api,
  });
}

async function deleteApi(req, res) {
  await apiService.deleteApi(req.params.apiId, req.auth);
  res.status(204).send();
}

module.exports = {
  createApi,
  listApis,
  getApi,
  updateApi,
  deleteApi,
};
