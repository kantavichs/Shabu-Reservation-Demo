"use client";

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import ConfirmDialog from '@/app/components/ConfirmDialog'; // Import ConfirmDialog

interface Table {
    tabID: number;
    tabTypes: string;
    tabStatus: string; // Add tabStatus property
}

type ActionType = 'confirm' | 'cancel' | 'available' | 'unavailable' | null;

const TableManagement = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<ActionType | null>(null); // Make sure the type includes null
    const [reservations, setReservations] = useState<any[]>([]);
    const [confirmMessage, setConfirmMessage] = useState('');
    
    const fetchTables = useCallback(async () => {
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
    }, []);

    const fetchAllReservations = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchTables();
        fetchAllReservations();
    }, [fetchTables, fetchAllReservations]);

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
        setActionType(null);
    };

    const getTableImage = (table: Table) => {
        if (table.tabTypes === 'VIP') {
            return table.tabStatus === 'available' ? '/darkgrey_vip_table.png' : '/lightgrey_vip_table.png';
        }
        return table.tabStatus === 'available' ? '/darkgreytable.png' : '/lightgreytable.png';
    };

    const getAvailableActions = (table: Table) => {
        const isTableReserved = reservations.some(
            (reservation) => reservation.Tables_tabID === table.tabID && reservation.resStatus === 'pending'
        );

        if (table.tabStatus === 'available') {
            return ['unavailable'];
        }
        if (isTableReserved) {
            return ['confirm', 'cancel'];
        }
        return ['available'];
    };

     const handleOptionChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const action = e.target.value as ActionType;
        setActionType(action);

        // Set the confirmation message based on the selected action
        let message = `Are you sure you want to ${action} Table ${selectedTable?.tabID}?`;
        setConfirmMessage(message);

        // Open the confirmation dialog
        setConfirmDialogOpen(true);
    };

    const confirmAction = async () => {
       if (!selectedTable || !actionType) {
            console.log("No selected table or action type");
            return;
        }

        try {
            let newStatus: string | undefined;
            let resStatus: string | undefined;
            let reservationIdToUpdate: number | undefined;

            if (actionType === 'available') {
                newStatus = 'available';
            } else if (actionType === 'unavailable') {
                newStatus = 'unavailable';
            } else if (actionType === 'confirm') {
                resStatus = 'confirmed';
                reservationIdToUpdate = reservations.find(
                    (reservation) =>
                        reservation.Tables_tabID === selectedTable.tabID && reservation.resStatus === 'pending'
                )?.resID;
            } else if (actionType === 'cancel') {
                newStatus = 'available';
                resStatus = 'cancelled';
                reservationIdToUpdate = reservations.find(
                    (reservation) =>
                        reservation.Tables_tabID === selectedTable.tabID && reservation.resStatus === 'pending'
                )?.resID;
            }

            // Optimistic update
            const updatedTables = tables.map((table) =>
                table.tabID === selectedTable.tabID ? { ...table, tabStatus: newStatus ?? table.tabStatus } : table
            );
            setTables(updatedTables);

            const updateTable = async () => {
                if (newStatus) {
                    const response = await fetch(`/api/tables/${selectedTable.tabID}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tabStatus: newStatus }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                        throw new Error(`HTTP error! status: ${response.status}, message: errorText`);
                    }
                } else {
                    console.log("No newStatus to update.");
                }
            };

            const updateReservation = async () => {
                if (resStatus && reservationIdToUpdate) {
                    try {
                        const response = await fetch(
                            `/api/reservations/${reservationIdToUpdate}`,
                            {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resStatus: resStatus }),
                            }
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                            throw new Error(`HTTP error! status: ${response.status}, message: errorData.message}`);
                        }
                    } catch (error) {
                        console.error("Could not update reservation status:", error);
                        throw error; // Re-throw to be caught by the outer catch
                    }
                } else {
                    console.log("No reservation to update.");
                }
            };

            await Promise.all([updateTable(), updateReservation()]);
        } catch (error) {
            console.error("Could not update reservation status:", error);
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
                {tables.map((table) => (
                    <div key={table.tabID} className="cursor-pointer relative">
                        <img
                            src={getTableImage(table)}
                            alt={`Table ${table.tabID}`}
                            className="w-full h-auto"
                            onClick={() => handleTableClick(table)}
                        />
                        <p className="text-center">
                            Table {table.tabID} ({table.tabTypes})
                        </p>

                        {selectedTable?.tabID === table.tabID && (
                            <div
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    zIndex: 10,
                                }}
                            >
                                <select
                                    id={`tableActions-${table.tabID}`}
                                    className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    onChange={handleOptionChange}
                                    defaultValue=""
                                >
                                    <option value="" disabled>
                                        Select an action
                                    </option>
                                    {getAvailableActions(table).map((action) => (
                                        <option key={action} value={action}>
                                            {action.charAt(0).toUpperCase() + action.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
            </div>

              {confirmDialogOpen && (
                <ConfirmDialog
                    isOpen={confirmDialogOpen}
                    message={confirmMessage}
                    onConfirm={confirmAction}
                    onCancel={cancelAction}
                />
            )}
        </div>
    );
};

export default TableManagement;