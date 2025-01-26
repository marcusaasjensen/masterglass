// app/models/Contact.ts

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    qualification: string;
    status: 'free' | 'occupied';
}
  