const formatDate = (value) => {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('es-CL');
};

const formatMoney = (value) => Number(value || 0).toFixed(2);

export const exportData = async (clients = [], loans = []) => {
    const XLSX = await import('xlsx');

    const clientRows = clients.map((client) => ({
        ID: client.id,
        Nombre: client.name,
        Email: client.email || '',
        Telefono: client.phone || '',
        Direccion: client.address || '',
        PrestamosActivos: Array.isArray(client.loans)
            ? client.loans.filter((loan) => loan.status !== 'Paid').length
            : ''
    }));

    const loanRows = loans.map((loan) => ({
        ID: loan.id,
        ClienteID: loan.clientId,
        MontoOriginal: formatMoney(loan.amount),
        TasaInteres: Number(loan.interestRate || 0),
        Frecuencia: loan.frequency,
        Tipo: loan.loanType,
        Estado: loan.status,
        FechaInicio: formatDate(loan.startDate),
        Pausado: loan.isPaused ? 'Si' : 'No',
        Pagado: Array.isArray(loan.payments)
            ? formatMoney(loan.payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0))
            : '',
        Pendiente: Array.isArray(loan.payments)
            ? formatMoney(
                loan.payments.reduce(
                    (sum, payment) =>
                        sum + Math.max(0, Number(payment.amount || 0) + Number(payment.lateFee || 0) - Number(payment.paidAmount || 0)),
                    0
                )
            )
            : ''
    }));

    const workbook = XLSX.utils.book_new();
    const clientsSheet = XLSX.utils.json_to_sheet(clientRows);
    const loansSheet = XLSX.utils.json_to_sheet(loanRows);

    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clientes');
    XLSX.utils.book_append_sheet(workbook, loansSheet, 'Prestamos');

    XLSX.writeFile(workbook, `LoanManager_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};
