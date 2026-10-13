export const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango',
  'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán',
  'Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas',
]

// Convierte el nombre de Google ("Coahuila de Zaragoza") al valor del ENUM ("Coahuila")
export const matchEstado = (nombre: string) =>
  [...ESTADOS_MX]
    .sort((a, b) => b.length - a.length)
    .find((e) => nombre.startsWith(e)) ?? ''