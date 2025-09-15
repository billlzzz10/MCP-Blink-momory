return {
  system_name: manifest.system_name,
  version: manifest.version,
  modules: (manifest.modules || []).map(m => m.name),
  audit_ready: !!manifest.audit_ready
};