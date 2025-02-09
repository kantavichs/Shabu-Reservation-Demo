"use client";

import { useState, useEffect, ChangeEvent } from 'react';

interface Table {
    tabID: number;
    tabTypes: string;
    tabStatus: string | null;
}

type ActionType = 'confirm' | 'cancel' | 'available' | 'unavailable' | null;

const TableManagement = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [reservations, setReservations] = useState<any[]>([]);

    const fetchTables = async () => {
        try {
            const response = await fetch('/api/tables');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setTables(data);
        } catch (error) {
            console.error("Could not fetch tables:", error);
        }
    };

    const fetchAllReservations = async () => {
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setReservations(data);
        } catch (error) {
            console.error("Could not fetch reservations:", error);
        }
    }

    useEffect(() => {
        fetchTables();
        fetchAllReservations();
    }, []);

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
    };

    const getTableImage = (table: Table) => {
        if (table.tabTypes === 'VIP') {
            return table.tabStatus === 'available' ? '/darkgrey_vip_table.png' : '/lightgrey_vip_table.png';
        } else {
            return table.tabStatus === 'available' ? '/darkgreytable.png' : '/lightgreytable.png';
        }
    };

    const getAvailableActions = (table: Table) => {
        const isTableReserved = reservations.some(reservation => reservation.Tables_tabID === table.tabID && reservation.resStatus === 'pending');

        if (table.tabStatus === 'available') {
            return ['unavailable'];
        } else {
            if (isTableReserved) {
                return ['confirm', 'cancel'];
            } else {
                return ['available']; // For walk-in customers who finished eating
            }
        }
    };

    const handleOptionChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const action = e.target.value as ActionType;
        setActionType(action);
        setConfirmDialogOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedTable || !actionType)
        {
            console.log("There is no selected table or action Type");
            return;
        }

        console.log("selectedTable: "+JSON.stringify(selectedTable));
        console.log("ActionType: "+ actionType);

        try {
            let newStatus: string | undefined = undefined;
            let resStatus: string | undefined = undefined;
            let reservationIdToUpdate: number | undefined = undefined;

            if (actionType === 'available') {
                newStatus = 'available';
            } else if (actionType === 'unavailable') {
                newStatus = 'unavailable';
            } else if (actionType === 'confirm') {
                resStatus = 'confirmed';
                reservationIdToUpdate = reservations.find(reservation => reservation.Tables_tabID === selectedTable.tabID && reservation.resStatus === 'pending')?.resID;
                 console.log("Reservation ID to Update: " + reservationIdToUpdate);

            } else if (actionType === 'cancel') {
                newStatus = 'available';
                resStatus = 'cancelled';
                 reservationIdToUpdate = reservations.find(reservation => reservation.Tables_tabID === selectedTable.tabID && reservation.resStatus === 'pending')?.resID;
                  console.log("Reservation ID to Update: " + reservationIdToUpdate);
            }
            //CHECK THE LOG
            console.log("ABOUT to send this API tabID: "+selectedTable.tabID);
            console.log("ABOUT to send this API  newStatus: "+newStatus);

            const updateTable = async () => {
                try {
                    const response = await fetch(`/api/tables/${selectedTable.tabID}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ tabStatus: newStatus }),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                } catch (error) {
                    console.error("Could not update table status:", error);
                }
            };

            const updateReservation = async () => {
                if (resStatus && reservationIdToUpdate) {
                    try {
                        const response = await fetch(`/api/reservations/${reservationIdToUpdate}`, { // Corrected URL
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ resStatus: resStatus }),
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                    } catch (error) {
                        console.error("Could not update reservation status:", error);
                    }
                }
            };

            await updateTable();
            await updateReservation();

            // Refresh table data after update
            try {
                const response = await fetch('/api/tables');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setTables(data);
            } catch (error) {
                console.error("Could not fetch tables:", error);
            }

             try {
                const response = await fetch('/api/reservations');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setReservations(data);
            } catch (error) {
                console.error("Could not fetch reservations:", error);
            }

        } catch (error) {
            console.error("Could not update table status:", error);
        } finally {
            setConfirmDialogOpen(false);
            setActionType(null);
            setSelectedTable(null);
        }
    };

    const cancelAction = () => {
        setConfirmDialogOpen(false);
        setActionType(null);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Table Management</h1>
            <div className="grid grid-cols-4 gap-4">
                {tables.map(table => (
                    <div key={table.tabID} className="cursor-pointer" onClick={() => handleTableClick(table)}>
                        <img src={getTableImage(table)} alt={`Table ${table.tabID}`} className="w-full h-auto" />
                        <p className="text-center">Table {table.tabID} ({table.tabTypes})</p>
                    </div>
                ))}
            </div>

            {selectedTable && (
                <div className="mt-4">
                    <label htmlFor="tableActions" className="block text-gray-700 text-sm font-bold mb-2">
                        Select Action for Table {selectedTable.tabID}:
                    </label>
                    <select
                        id="tableActions"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        onChange={handleOptionChange}
                        defaultValue=""
                    >
                        <option value="" disabled>Select an action</option>
                        {getAvailableActions(selectedTable).map(action => (
                            <option key={action} value={action}>
                                {action.charAt(0).toUpperCase() + action.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {confirmDialogOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-bold text-gray-800">Confirm Action</h3>
                        <div className="mt-2 text-gray-600">
                            <p>Are you sure you want to {actionType} Table {selectedTable?.tabID}?</p>
                        </div>
                        <div className="items-center px-4 py-3">
                            <button
                                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                                onClick={confirmAction}
                            >
                                Confirm
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
                                onClick={cancelAction}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableManagement;