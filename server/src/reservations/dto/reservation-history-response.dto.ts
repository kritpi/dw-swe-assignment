export type ReservationHistoryResponseDto = {
  id: string;
  action: 'RESERVE' | 'CANCEL';
  actionAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  concert: {
    id: string;
    name: string;
  };
};
