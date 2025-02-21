// app/components/ReservationSummary.tsx
interface ReservationSummaryProps {
    reservationDetails: {
      resName: string;
      customerPhone: string;
      numberOfPeople: number;
      tabID: string;
      resDate: string;
      resTime: string;
    };
  }
  
  const ReservationSummary: React.FC<ReservationSummaryProps> = ({ reservationDetails }) => {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Reservation Summary</h1>
        <div>
          <p>Reservation Name: {reservationDetails.resName}</p>
          <p>Phone Number: {reservationDetails.customerPhone}</p>
          <p>Number of People: {reservationDetails.numberOfPeople}</p>
          <p>Table Number: {reservationDetails.tabID}</p>
          <p>Date: {reservationDetails.resDate}</p>
          <p>Time: {reservationDetails.resTime}</p>
        </div>
      </div>
    );
  };
  
  export default ReservationSummary;