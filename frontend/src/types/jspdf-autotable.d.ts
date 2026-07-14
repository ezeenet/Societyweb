import { jsPDF } from 'jspdf';
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: object) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}