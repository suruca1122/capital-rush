// Bancos de preguntas de Contabilidad (PGC Pymes) e IVA.
// Cada generador recibe `used` (Set de ids ya preguntados en la partida) para no repetir.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
function pickUnused(list, used, idFn) {
  const free = list.filter((x) => !used.has(idFn(x)));
  const item = pick(free.length ? free : list);
  used.add(idFn(item));
  return item;
}

// =====================================================================
// CUADRO DE CUENTAS DEL PGC PYMES (selección de cuentas de 3 dígitos)
// m = masa patrimonial (solo cuentas de balance): ANC, AC, PN, PNC, PC
// n = nota aclaratoria para la clasificación
// =====================================================================
const ACCOUNTS = [
  // ---------- Grupo 1: Financiación básica ----------
  ['100', 'Capital social', 'PN'],
  ['101', 'Fondo social', 'PN'],
  ['102', 'Capital', 'PN', 'Es el capital del empresario individual.'],
  ['103', 'Socios por desembolsos no exigidos', 'PN', 'Figura en el patrimonio neto con signo negativo, minorando el capital.'],
  ['110', 'Prima de emisión o asunción', 'PN'],
  ['112', 'Reserva legal', 'PN'],
  ['113', 'Reservas voluntarias', 'PN'],
  ['114', 'Reservas especiales', 'PN'],
  ['118', 'Aportaciones de socios o propietarios', 'PN'],
  ['120', 'Remanente', 'PN'],
  ['121', 'Resultados negativos de ejercicios anteriores', 'PN', 'Figura en el patrimonio neto con signo negativo.'],
  ['129', 'Resultado del ejercicio', 'PN'],
  ['130', 'Subvenciones oficiales de capital', 'PN', 'Las subvenciones de capital no reintegrables forman parte del patrimonio neto.'],
  ['131', 'Donaciones y legados de capital', 'PN'],
  ['141', 'Provisión para impuestos', 'PNC'],
  ['142', 'Provisión para otras responsabilidades', 'PNC'],
  ['143', 'Provisión por desmantelamiento, retiro o rehabilitación del inmovilizado', 'PNC'],
  ['145', 'Provisión para actuaciones medioambientales', 'PNC'],
  ['170', 'Deudas a largo plazo con entidades de crédito', 'PNC'],
  ['171', 'Deudas a largo plazo', 'PNC'],
  ['173', 'Proveedores de inmovilizado a largo plazo', 'PNC'],
  ['174', 'Acreedores por arrendamiento financiero a largo plazo', 'PNC'],
  ['175', 'Efectos a pagar a largo plazo', 'PNC'],
  ['177', 'Obligaciones y bonos', 'PNC'],
  ['180', 'Fianzas recibidas a largo plazo', 'PNC'],
  ['185', 'Depósitos recibidos a largo plazo', 'PNC'],
  // ---------- Grupo 2: Activo no corriente ----------
  ['200', 'Investigación', 'ANC'],
  ['201', 'Desarrollo', 'ANC'],
  ['202', 'Concesiones administrativas', 'ANC'],
  ['203', 'Propiedad industrial', 'ANC'],
  ['205', 'Derechos de traspaso', 'ANC'],
  ['206', 'Aplicaciones informáticas', 'ANC'],
  ['210', 'Terrenos y bienes naturales', 'ANC'],
  ['211', 'Construcciones', 'ANC'],
  ['212', 'Instalaciones técnicas', 'ANC'],
  ['213', 'Maquinaria', 'ANC'],
  ['214', 'Utillaje', 'ANC'],
  ['215', 'Otras instalaciones', 'ANC'],
  ['216', 'Mobiliario', 'ANC'],
  ['217', 'Equipos para procesos de información', 'ANC'],
  ['218', 'Elementos de transporte', 'ANC'],
  ['219', 'Otro inmovilizado material', 'ANC'],
  ['220', 'Inversiones en terrenos y bienes naturales', 'ANC'],
  ['221', 'Inversiones en construcciones', 'ANC'],
  ['231', 'Construcciones en curso', 'ANC'],
  ['232', 'Instalaciones técnicas en montaje', 'ANC'],
  ['239', 'Anticipos para inmovilizaciones materiales', 'ANC'],
  ['250', 'Inversiones financieras a largo plazo en instrumentos de patrimonio', 'ANC'],
  ['251', 'Valores representativos de deuda a largo plazo', 'ANC'],
  ['252', 'Créditos a largo plazo', 'ANC'],
  ['253', 'Créditos a largo plazo por enajenación de inmovilizado', 'ANC'],
  ['254', 'Créditos a largo plazo al personal', 'ANC'],
  ['258', 'Imposiciones a largo plazo', 'ANC'],
  ['260', 'Fianzas constituidas a largo plazo', 'ANC'],
  ['265', 'Depósitos constituidos a largo plazo', 'ANC'],
  ['280', 'Amortización acumulada del inmovilizado intangible', 'ANC', 'Es una cuenta compensadora: aparece en el activo no corriente restando.'],
  ['281', 'Amortización acumulada del inmovilizado material', 'ANC', 'Es una cuenta compensadora: aparece en el activo no corriente restando.'],
  ['282', 'Amortización acumulada de las inversiones inmobiliarias', 'ANC', 'Es una cuenta compensadora: aparece en el activo no corriente restando.'],
  ['290', 'Deterioro de valor del inmovilizado intangible', 'ANC', 'Corrección valorativa: minora el activo no corriente.'],
  ['291', 'Deterioro de valor del inmovilizado material', 'ANC', 'Corrección valorativa: minora el activo no corriente.'],
  // ---------- Grupo 3: Existencias ----------
  ['300', 'Mercaderías', 'AC'],
  ['310', 'Materias primas', 'AC'],
  ['321', 'Combustibles', 'AC'],
  ['322', 'Repuestos', 'AC'],
  ['326', 'Embalajes', 'AC'],
  ['327', 'Envases', 'AC'],
  ['328', 'Material de oficina', 'AC'],
  ['330', 'Productos en curso', 'AC'],
  ['340', 'Productos semiterminados', 'AC'],
  ['350', 'Productos terminados', 'AC'],
  ['390', 'Deterioro de valor de las mercaderías', 'AC', 'Corrección valorativa de existencias: minora el activo corriente.'],
  // ---------- Grupo 4: Acreedores y deudores por operaciones comerciales ----------
  ['400', 'Proveedores', 'PC'],
  ['401', 'Proveedores, efectos comerciales a pagar', 'PC'],
  ['406', 'Envases y embalajes a devolver a proveedores', null],
  ['407', 'Anticipos a proveedores', 'AC', 'Es un derecho de cobro (entregas a cuenta a proveedores), aunque esté en el subgrupo 40.'],
  ['410', 'Acreedores por prestaciones de servicios', 'PC'],
  ['411', 'Acreedores, efectos comerciales a pagar', 'PC'],
  ['430', 'Clientes', 'AC'],
  ['431', 'Clientes, efectos comerciales a cobrar', 'AC'],
  ['436', 'Clientes de dudoso cobro', 'AC'],
  ['437', 'Envases y embalajes a devolver por clientes', null],
  ['438', 'Anticipos de clientes', 'PC', 'Es una obligación (entregas a cuenta recibidas de clientes), aunque esté en el subgrupo 43.'],
  ['440', 'Deudores', 'AC'],
  ['441', 'Deudores, efectos comerciales a cobrar', 'AC'],
  ['460', 'Anticipos de remuneraciones', 'AC'],
  ['465', 'Remuneraciones pendientes de pago', 'PC'],
  ['470', 'Hacienda Pública, deudora por diversos conceptos', 'AC'],
  ['471', 'Organismos de la Seguridad Social, deudores', 'AC'],
  ['472', 'Hacienda Pública, IVA soportado', 'AC'],
  ['473', 'Hacienda Pública, retenciones y pagos a cuenta', 'AC'],
  ['474', 'Activos por impuesto diferido', 'ANC', 'En el balance, los activos por impuesto diferido se presentan siempre en el activo no corriente.'],
  ['475', 'Hacienda Pública, acreedora por conceptos fiscales', 'PC'],
  ['476', 'Organismos de la Seguridad Social, acreedores', 'PC'],
  ['477', 'Hacienda Pública, IVA repercutido', 'PC'],
  ['479', 'Pasivos por diferencias temporarias imponibles', 'PNC', 'En el balance, los pasivos por impuesto diferido se presentan siempre en el pasivo no corriente.'],
  ['480', 'Gastos anticipados', 'AC', 'Periodificación a corto plazo en el activo.'],
  ['485', 'Ingresos anticipados', 'PC', 'Periodificación a corto plazo en el pasivo.'],
  ['490', 'Deterioro de valor de créditos por operaciones comerciales', 'AC', 'Corrección valorativa: minora el saldo de clientes en el activo corriente.'],
  ['499', 'Provisiones por operaciones comerciales', 'PC'],
  // ---------- Grupo 5: Cuentas financieras ----------
  ['500', 'Obligaciones y bonos a corto plazo', 'PC'],
  ['520', 'Deudas a corto plazo con entidades de crédito', 'PC'],
  ['521', 'Deudas a corto plazo', 'PC'],
  ['523', 'Proveedores de inmovilizado a corto plazo', 'PC'],
  ['524', 'Acreedores por arrendamiento financiero a corto plazo', 'PC'],
  ['525', 'Efectos a pagar a corto plazo', 'PC'],
  ['526', 'Dividendo activo a pagar', 'PC'],
  ['527', 'Intereses a corto plazo de deudas con entidades de crédito', 'PC'],
  ['529', 'Provisiones a corto plazo', 'PC'],
  ['540', 'Inversiones financieras a corto plazo en instrumentos de patrimonio', 'AC'],
  ['541', 'Valores representativos de deuda a corto plazo', 'AC'],
  ['542', 'Créditos a corto plazo', 'AC'],
  ['543', 'Créditos a corto plazo por enajenación de inmovilizado', 'AC'],
  ['544', 'Créditos a corto plazo al personal', 'AC'],
  ['545', 'Dividendo a cobrar', 'AC'],
  ['548', 'Imposiciones a corto plazo', 'AC'],
  ['551', 'Cuenta corriente con socios y administradores', null],
  ['555', 'Partidas pendientes de aplicación', null],
  ['557', 'Dividendo activo a cuenta', 'PN', 'Figura en el patrimonio neto con signo negativo.'],
  ['558', 'Socios por desembolsos exigidos', 'AC', 'Es un derecho de cobro frente a los socios por dividendos pasivos ya exigidos.'],
  ['560', 'Fianzas recibidas a corto plazo', 'PC'],
  ['561', 'Depósitos recibidos a corto plazo', 'PC'],
  ['565', 'Fianzas constituidas a corto plazo', 'AC'],
  ['566', 'Depósitos constituidos a corto plazo', 'AC'],
  ['567', 'Intereses pagados por anticipado', 'AC'],
  ['568', 'Intereses cobrados por anticipado', 'PC'],
  ['570', 'Caja, euros', 'AC'],
  ['571', 'Caja, moneda extranjera', 'AC'],
  ['572', 'Bancos e instituciones de crédito c/c vista, euros', 'AC'],
  ['574', 'Bancos e instituciones de crédito, cuentas de ahorro, euros', 'AC'],
  ['576', 'Inversiones a corto plazo de gran liquidez', 'AC'],
  // ---------- Grupo 6: Compras y gastos ----------
  ['600', 'Compras de mercaderías'],
  ['601', 'Compras de materias primas'],
  ['602', 'Compras de otros aprovisionamientos'],
  ['606', 'Descuentos sobre compras por pronto pago'],
  ['607', 'Trabajos realizados por otras empresas'],
  ['608', 'Devoluciones de compras y operaciones similares'],
  ['609', '«Rappels» por compras'],
  ['610', 'Variación de existencias de mercaderías'],
  ['611', 'Variación de existencias de materias primas'],
  ['621', 'Arrendamientos y cánones'],
  ['622', 'Reparaciones y conservación'],
  ['623', 'Servicios de profesionales independientes'],
  ['624', 'Transportes'],
  ['625', 'Primas de seguros'],
  ['626', 'Servicios bancarios y similares'],
  ['627', 'Publicidad, propaganda y relaciones públicas'],
  ['628', 'Suministros'],
  ['629', 'Otros servicios'],
  ['630', 'Impuesto sobre beneficios'],
  ['631', 'Otros tributos'],
  ['640', 'Sueldos y salarios'],
  ['641', 'Indemnizaciones'],
  ['642', 'Seguridad Social a cargo de la empresa'],
  ['649', 'Otros gastos sociales'],
  ['650', 'Pérdidas de créditos comerciales incobrables'],
  ['662', 'Intereses de deudas'],
  ['665', 'Intereses por descuento de efectos y operaciones de factoring'],
  ['668', 'Diferencias negativas de cambio'],
  ['669', 'Otros gastos financieros'],
  ['671', 'Pérdidas procedentes del inmovilizado material'],
  ['678', 'Gastos excepcionales'],
  ['680', 'Amortización del inmovilizado intangible'],
  ['681', 'Amortización del inmovilizado material'],
  ['682', 'Amortización de las inversiones inmobiliarias'],
  ['691', 'Pérdidas por deterioro del inmovilizado material'],
  ['693', 'Pérdidas por deterioro de existencias'],
  ['694', 'Pérdidas por deterioro de créditos por operaciones comerciales'],
  // ---------- Grupo 7: Ventas e ingresos ----------
  ['700', 'Ventas de mercaderías'],
  ['701', 'Ventas de productos terminados'],
  ['704', 'Ventas de envases y embalajes'],
  ['705', 'Prestaciones de servicios'],
  ['706', 'Descuentos sobre ventas por pronto pago'],
  ['708', 'Devoluciones de ventas y operaciones similares'],
  ['709', '«Rappels» sobre ventas'],
  ['712', 'Variación de existencias de productos terminados'],
  ['731', 'Trabajos realizados para el inmovilizado material'],
  ['740', 'Subvenciones, donaciones y legados a la explotación'],
  ['746', 'Subvenciones, donaciones y legados de capital transferidos al resultado del ejercicio'],
  ['752', 'Ingresos por arrendamientos'],
  ['754', 'Ingresos por comisiones'],
  ['759', 'Ingresos por servicios diversos'],
  ['760', 'Ingresos de participaciones en instrumentos de patrimonio'],
  ['762', 'Ingresos de créditos'],
  ['768', 'Diferencias positivas de cambio'],
  ['769', 'Otros ingresos financieros'],
  ['771', 'Beneficios procedentes del inmovilizado material'],
  ['778', 'Ingresos excepcionales'],
  ['791', 'Reversión del deterioro del inmovilizado material'],
  ['793', 'Reversión del deterioro de existencias'],
  ['794', 'Reversión del deterioro de créditos por operaciones comerciales'],
].map(([num, name, mass, note]) => ({ num, name, mass: mass || null, note: note || '' }));

const GROUP_NAMES = {
  1: 'Grupo 1 · Financiación básica', 2: 'Grupo 2 · Activo no corriente', 3: 'Grupo 3 · Existencias',
  4: 'Grupo 4 · Acreedores y deudores por operaciones comerciales', 5: 'Grupo 5 · Cuentas financieras',
  6: 'Grupo 6 · Compras y gastos', 7: 'Grupo 7 · Ventas e ingresos',
};

// Distractores: cuentas "vecinas" (mismo subgrupo primero, luego mismo grupo)
function nearbyAccounts(acc, n = 3) {
  const sameSub = shuffle(ACCOUNTS.filter((a) => a !== acc && a.num.slice(0, 2) === acc.num.slice(0, 2)));
  const sameGroup = shuffle(ACCOUNTS.filter((a) => a !== acc && a.num[0] === acc.num[0] && a.num.slice(0, 2) !== acc.num.slice(0, 2)));
  return [...sameSub, ...sameGroup].slice(0, n);
}

const accountGens = [
  // Nombre -> número
  (used) => {
    const acc = pickUnused(ACCOUNTS, used, (a) => 'acc:' + a.num);
    const options = shuffle([acc, ...nearbyAccounts(acc)]).map((a) => a.num);
    return {
      text: `¿Qué <b>número</b> tiene en el PGC de Pymes la cuenta <b>«${acc.name}»</b>?`,
      options, correctIndex: options.indexOf(acc.num),
      formula: `${acc.num} · ${acc.name}`,
      steps: GROUP_NAMES[acc.num[0]],
    };
  },
  // Número -> nombre
  (used) => {
    const acc = pickUnused(ACCOUNTS, used, (a) => 'acc:' + a.num);
    const options = shuffle([acc, ...nearbyAccounts(acc)]).map((a) => a.name);
    return {
      text: `¿Cómo se llama en el PGC de Pymes la cuenta <b class="big-num">${acc.num}</b>?`,
      options, correctIndex: options.indexOf(acc.name),
      formula: `${acc.num} · ${acc.name}`,
      steps: GROUP_NAMES[acc.num[0]],
    };
  },
];

// =====================================================================
// MASAS PATRIMONIALES
// =====================================================================
const MASSES = {
  ANC: { label: 'Activo no corriente', why: 'Son bienes y derechos que permanecerán en la empresa más de un año.' },
  AC: { label: 'Activo corriente', why: 'Son bienes y derechos que se convertirán en dinero (o se consumirán) en menos de un año o dentro del ciclo de explotación.' },
  PN: { label: 'Patrimonio neto', why: 'Son fondos propios de la empresa: aportaciones de los socios, resultados no distribuidos y subvenciones de capital.' },
  PNC: { label: 'Pasivo no corriente', why: 'Son obligaciones con vencimiento superior a un año.' },
  PC: { label: 'Pasivo corriente', why: 'Son obligaciones con vencimiento inferior a un año.' },
};
const MASS_ORDER = ['ANC', 'AC', 'PN', 'PNC', 'PC'];

// Presenta 4 de las 5 categorías (siempre la correcta), en orden fijo
function fourOf(order, correct) {
  const wrong = order.filter((k) => k !== correct);
  const drop = pick(wrong);
  return order.filter((k) => k !== drop);
}

const balanceAccounts = ACCOUNTS.filter((a) => a.mass);
const massGens = [
  (used) => {
    const acc = pickUnused(balanceAccounts, used, (a) => 'mass:' + a.num);
    const keys = fourOf(MASS_ORDER, acc.mass);
    return {
      text: `¿En qué <b>masa patrimonial</b> del balance se incluye la cuenta <b>${acc.num} «${acc.name}»</b>?`,
      options: keys.map((k) => MASSES[k].label), correctIndex: keys.indexOf(acc.mass),
      formula: `${acc.num} → ${MASSES[acc.mass].label}`,
      steps: acc.note || MASSES[acc.mass].why,
    };
  },
];

// =====================================================================
// IVA: calificación de operaciones (Ley 37/1992 del IVA)
// =====================================================================
const IVA_CATS = {
  S: { label: 'Sujeta (y no exenta)', why: 'Es una entrega de bienes o prestación de servicios realizada por un empresario o profesional en el ejercicio de su actividad (o una importación o adquisición intracomunitaria) que no está exenta: se repercute IVA.' },
  NS: { label: 'No sujeta', why: 'No se produce el hecho imponible del IVA o la ley la declara expresamente no sujeta (art. 7 LIVA): no se repercute IVA.' },
  EL: { label: 'Exenta limitada', why: 'Exenta por el art. 20 LIVA (operaciones interiores): no se repercute IVA y el empresario NO puede deducir el IVA soportado relacionado.' },
  EP: { label: 'Exenta plena', why: 'Exenta con derecho a deducción (exportaciones y entregas intracomunitarias, arts. 21-25 LIVA): no se repercute IVA pero SÍ se puede deducir el IVA soportado.' },
  ND: { label: 'IVA no deducible', why: 'El IVA soportado no se puede deducir (arts. 95-97 LIVA): bienes no afectos, atenciones a clientes, joyas, alimentos, tabaco, espectáculos o facturas sin requisitos.' },
};
const IVA_ORDER = ['S', 'NS', 'EL', 'EP', 'ND'];

const IVA_OPS = [
  // Sujetas y no exentas
  ['S', 'Un fontanero autónomo cobra a un particular la reparación de una caldera.'],
  ['S', 'Una tienda de ropa vende un abrigo a un cliente en su local de Sevilla.'],
  ['S', 'Un abogado factura sus honorarios a una empresa por un asesoramiento.'],
  ['S', 'Un restaurante cobra un menú del día a un cliente.'],
  ['S', 'Una empresa vende a otra empresa española un ordenador usado de su oficina.'],
  ['S', 'Una empresa alquila un local comercial a otra empresa para instalar una tienda.'],
  ['S', 'Un promotor inmobiliario vende una vivienda nueva a su primer comprador (primera entrega).'],
  ['S', 'Una peluquería cobra un corte de pelo.'],
  ['S', 'Una empresa española importa maquinaria procedente de China.', 'Las importaciones de bienes son hecho imponible del IVA aunque las realice un particular.'],
  ['S', 'Una empresa española compra mercancías a un proveedor alemán (adquisición intracomunitaria de bienes).', 'La adquisición intracomunitaria de bienes es hecho imponible en España: la empresa se autorrepercute el IVA.'],
  ['S', 'El dueño de un supermercado se lleva a casa productos de su tienda para consumo de su familia.', 'Es un autoconsumo de bienes, que la ley asimila a una entrega de bienes sujeta (art. 9 LIVA).'],
  ['S', 'Un taxista cobra una carrera a un pasajero.'],
  ['S', 'Un gimnasio con ánimo de lucro cobra la cuota mensual a sus clientes.'],
  // No sujetas
  ['NS', 'Un empresario vende todo su negocio (unidad económica autónoma) a otro que continúa con la misma actividad.', 'La transmisión de un patrimonio empresarial que constituye una unidad económica autónoma no está sujeta (art. 7.1 LIVA).'],
  ['NS', 'Una empresa reparte gratuitamente muestras sin valor comercial de un nuevo producto para promocionarlo.', 'Las muestras gratuitas sin valor comercial con fines de promoción no están sujetas (art. 7.4 LIVA).'],
  ['NS', 'Un trabajador presta sus servicios a la empresa a cambio de su nómina.', 'Los servicios prestados en régimen de dependencia laboral no están sujetos (art. 7.5 LIVA).'],
  ['NS', 'Un particular vende su coche usado a otro particular.', 'Quien vende no es empresario ni profesional, así que no hay hecho imponible del IVA (tributa por Transmisiones Patrimoniales).'],
  ['NS', 'Un cliente entrega dinero en efectivo a una empresa para pagar una factura.', 'Las entregas de dinero como contraprestación o pago no están sujetas (art. 7.12 LIVA).'],
  ['NS', 'Un ayuntamiento cobra una tasa por expedir un certificado de empadronamiento.', 'Los servicios de entes públicos realizados sin contraprestación o mediante tasas no están sujetos (art. 7.8 LIVA).'],
  ['NS', 'Una empresa regala a sus clientes bolígrafos con su logotipo, de escaso valor.', 'Los objetos publicitarios de escaso valor no están sujetos (art. 7.2 LIVA).'],
  ['NS', 'Una empresa recibe una indemnización de su aseguradora por los daños de un incendio.', 'Una indemnización no es contraprestación de ninguna entrega de bienes ni prestación de servicios.'],
  // Exentas limitadas (art. 20)
  ['EL', 'Un médico atiende en su consulta privada a un paciente por una enfermedad.', 'La asistencia sanitaria a personas está exenta (art. 20.1.3º LIVA).'],
  ['EL', 'Un dentista empasta una muela a un paciente.', 'Los servicios de estomatólogos y odontólogos están exentos (art. 20.1.5º LIVA).'],
  ['EL', 'Un colegio privado cobra la enseñanza de Educación Primaria a sus alumnos.', 'La enseñanza reglada está exenta (art. 20.1.9º LIVA).'],
  ['EL', 'Una persona física da clases particulares de Matemáticas de Bachillerato.', 'Las clases particulares de materias de los planes de estudios dadas por personas físicas están exentas (art. 20.1.10º LIVA).'],
  ['EL', 'Una aseguradora cobra la prima del seguro de un coche.', 'Las operaciones de seguro están exentas (art. 20.1.16º LIVA).'],
  ['EL', 'Un banco concede un préstamo a una empresa y le cobra intereses.', 'Las operaciones financieras están exentas (art. 20.1.18º LIVA).'],
  ['EL', 'Una empresa alquila un piso a una familia para que viva en él.', 'El arrendamiento de vivienda está exento (art. 20.1.23º LIVA).'],
  ['EL', 'Una empresa vende un piso usado a un particular (segunda entrega).', 'Las segundas y ulteriores entregas de edificaciones están exentas (art. 20.1.22º LIVA).'],
  ['EL', 'Una empresa vende un terreno rústico no edificable.', 'Las entregas de terrenos rústicos y no edificables están exentas (art. 20.1.20º LIVA).'],
  ['EL', 'Un club deportivo sin ánimo de lucro cobra las cuotas a sus socios.', 'Los servicios deportivos de entidades sin ánimo de lucro a sus socios están exentos (art. 20.1.13º LIVA).'],
  ['EL', 'Una administración de lotería vende un décimo de la Lotería Nacional.', 'Las loterías y apuestas del Estado están exentas (art. 20.1.19º LIVA).'],
  // Exentas plenas (arts. 21-25)
  ['EP', 'Una empresa española exporta aceite a un cliente de Estados Unidos.', 'Las exportaciones están exentas con derecho a deducción (art. 21 LIVA).'],
  ['EP', 'Una empresa española vende maquinaria a una empresa francesa con NIF-IVA (entrega intracomunitaria).', 'Las entregas intracomunitarias de bienes están exentas con derecho a deducción (art. 25 LIVA).'],
  ['EP', 'Una tienda vende un bolso a un turista residente en México, que lo saca de la UE en su equipaje (tax free).', 'Se considera una exportación: exenta con derecho a deducción (art. 21.2º LIVA).'],
  ['EP', 'Una empresa transporta hasta el puerto mercancías que se van a exportar fuera de la UE.', 'Los servicios relacionados directamente con las exportaciones están exentos con derecho a deducción (art. 21.5º LIVA).'],
  ['EP', 'Una empresa suministra combustible a un buque de navegación marítima internacional.', 'Las operaciones asimiladas a exportaciones están exentas con derecho a deducción (art. 22 LIVA).'],
  // IVA soportado no deducible
  ['ND', 'Una empresa de transportes compra unas joyas y paga el IVA correspondiente.', 'El IVA de joyas, alhajas y piedras preciosas no es deducible (art. 96.1.1º LIVA).'],
  ['ND', 'Un empresario invita a cenar a varios clientes y paga el IVA del restaurante.', 'El IVA de las atenciones a clientes no es deducible (art. 96.1.5º LIVA).'],
  ['ND', 'Una empresa compra entradas para un concierto y las regala a sus clientes.', 'El IVA de espectáculos y atenciones a clientes no es deducible (art. 96.1.4º y 5º LIVA).'],
  ['ND', 'Un empresario compra un televisor para el salón de su casa y lo paga con la cuenta de la empresa.', 'El bien no está afecto a la actividad empresarial, así que su IVA no es deducible (art. 95 LIVA).'],
  ['ND', 'Un empresario compra la comida de la semana para su familia.', 'El IVA de alimentos y bebidas para el consumo del empresario y su familia no es deducible (art. 96.1.2º LIVA).'],
  ['ND', 'Una empresa compra cartones de tabaco y paga el IVA.', 'El IVA del tabaco no es deducible (art. 96.1.3º LIVA).'],
  ['ND', 'Un médico compra material para su consulta y paga el IVA correspondiente.', 'El médico solo realiza operaciones exentas limitadas, así que no puede deducir el IVA que soporta.'],
  ['ND', 'Una empresa paga el IVA de un gasto, pero solo tiene un tique sin sus datos fiscales.', 'Sin factura completa con los datos del destinatario no se puede deducir el IVA (art. 97 LIVA).'],
].map(([cat, text, note], i) => ({ id: 'iva:' + i, cat, text, note: note || '' }));

const ivaGens = [
  (used) => {
    const op = pickUnused(IVA_OPS, used, (o) => o.id);
    const keys = fourOf(IVA_ORDER, op.cat);
    const q = `${op.text}<br><span class="sub">¿Cómo se califica a efectos de IVA?</span>`;
    return {
      text: q,
      options: keys.map((k) => IVA_CATS[k].label), correctIndex: keys.indexOf(op.cat),
      formula: IVA_CATS[op.cat].label,
      steps: op.note || IVA_CATS[op.cat].why,
    };
  },
];

module.exports = { accountGens, massGens, ivaGens, ACCOUNTS, IVA_OPS };
