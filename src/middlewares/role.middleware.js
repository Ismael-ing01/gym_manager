const checkRole = (rolesPermitidos) => {
  const permitidos = Array.isArray(rolesPermitidos)
    ? rolesPermitidos
    : [rolesPermitidos];

  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!permitidos.includes(req.user.rol)) {
      return res.status(403).json({
        message: "No tienes permisos para esta acción",
      });
    }
    next();
  };
};

module.exports = checkRole;
