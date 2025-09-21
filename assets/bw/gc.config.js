// Config global del ecosistema BW (marca + navegación)
export const GC_CONFIG = {
  brand: {
    logoPng:  "images/logo1.png",
    logoWebp: "images/logo1.webp",
    homeHref: "index.html", // el shell lo forzará a la URL absoluta de Inicio
  },
  heroDefault: {
    title: "Hola Kevin, listo para romperla hoy 💪",
    subtitle: "Sesión verificada ✅ | Accesos rápidos y estado general.",
  },
  // Importante: rutas SIN slash inicial. El shell arma los absolutos.
  nav: [
    { type: "link", href: "index.html", icon: "🏠", label: "Inicio" },

    {
      type: "group",
      id: "grp-reportes",
      title: "Reportes",
      items: [
        { href: "reports/newreport.html", icon: "🧰", label: "New Report" },
        { href: "reports/psreport.html",  icon: "🚚", label: "Post-Sale Report" },
      ],
    },

    {
      type: "group",
      id: "grp-operaciones",
      title: "Operaciones",
      items: [
        { href: "operations/distribucion.html", icon: "📋", label: "Distribución" },
        { href: "operations/biops.html",        icon: "🔗", label: "BI de OPs + Links" },
      ],
    },

    {
      type: "group",
      id: "grp-cobertura",
      title: "Cobertura",
      items: [
        { href: "cobertura.html",    icon: "🗺️", label: "Mapa de cobertura" },
        { href: "newcobertura.html", icon: "🧭", label: "New Cobertura 1.1" },
      ],
    },

    {
      type: "group",
      id: "grp-utils",
      title: "Utilidades",
      items: [
        { href: "utilities/camprev.html", icon: "👥", label: "Selector de Apoyo 2.0" },
      ],
    },

    // =========================
    // NUEVO: sección solo Admin
    // =========================
    {
      type: "group",
      id: "grp-admin",
      title: "Admin",
      roles: ["admin"], // ← visible solo si el claim rank === "admin"
      items: [
        { href: "admin/admin.html", icon: "🛡️", label: "Panel de roles", roles: ["admin"] },
      ],
    },
  ],
};
