const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    const user = req.user;

    if (!rolesPermitidos.includes(user.rol)) {
      return res.status(403).json({
        message: "No tienes permisos para esta acción",
      });
    }

    next();
  };
};

module.exports = checkRole;
