/**
 * Small in-app sample CSVs so reviewers can try the importer in one click,
 * without needing a file. Each deliberately uses different headers/layouts to
 * show off the AI field-mapping.
 */
export interface Sample {
  id: string;
  label: string;
  description: string;
  filename: string;
  content: string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'facebook',
    label: 'Facebook Leads',
    description: 'Lead-ad export with ISO timestamps & campaign names',
    filename: 'facebook-lead-export.csv',
    content: `created_time,id,full_name,email,phone_number,city,campaign_name,form_name,lead_status
2026-05-13T14:20:48+0000,f_1001,John Doe,john.doe@example.com,+91 98765 43210,Mumbai,Leads on Demand,Contact Form,Interested
2026-05-13T14:25:30+0000,f_1002,Sarah Johnson,sarah.johnson@example.com,+919876543211,Bangalore,Meridian Tower Campaign,Contact Form,Not Reachable
2026-05-13T14:30:15+0000,f_1003,Rajesh Patel,,+91 9876543212,Delhi,Eden Park Promo,Contact Form,Not Interested
2026-05-13T14:35:22+0000,f_1004,Priya Singh,priya.singh@example.com,+91 98765 43213,Pune,Sarjapur Plots,Contact Form,Booked
2026-05-13T14:40:10+0000,f_1005,Amit Kumar,amit@example.com,,Chennai,Leads on Demand,Newsletter,Callback Requested
2026-05-13T14:45:55+0000,f_1006,Anonymous Visitor,,,Kolkata,Brand Awareness,Contact Form,New`,
  },
  {
    id: 'realestate',
    label: 'Real-Estate CRM',
    description: 'Projects, possession dates, alternate numbers & remarks',
    filename: 'real-estate-crm.csv',
    content: `Date,Client Name,Contact Number,Alternate Number,Email ID,Project,Possession,Budget,Remarks,Assigned To,Stage
13/05/2026 15:10,Vikram Rao,+91-9812345678,9822233344,vikram.rao@gmail.com,Meridian Tower,Ready to Move,1.2 Cr,"Wants a 3BHK, prefers higher floor",rahul@groweasy.ai,Site Visit Done
13/05/2026 15:20,Neha Sharma,9845567890,,neha.sharma@outlook.com,Eden Park,Dec 2027,85 Lakhs,Asked for brochure and payment plan,rahul@groweasy.ai,Follow Up
13/05/2026 15:35,Mohan Iyer,+91 9700011122,,,Sarjapur Plots,2 years,50 Lakhs,Only enquiry no contact shared yet,priya@groweasy.ai,New Lead
13/05/2026 15:50,Deepa Menon,9611122233,9611199888,deepa.menon@yahoo.com,Meridian Tower,Ready to Move,1.5 Cr,"Deal closed, token received",rahul@groweasy.ai,Booked
13/05/2026 16:05,Karan Malhotra,9900011122,,karan.m@gmail.com,Whitefield Heights,Q4 2028,95 Lakhs,Budget mismatch not interested,priya@groweasy.ai,Lost`,
  },
  {
    id: 'messy',
    label: 'Messy Sheet',
    description: 'Multiple emails/phones, invalid rows & odd column names',
    filename: 'messy-marketing-sheet.csv',
    content: `Sl No,Name,Emails,Phone Numbers,Firm,Notes,Lead Stage,Where From
1,Ravi Teja,"ravi.teja@company.com, ravi.personal@gmail.com","9876500011 / 9876500022",Acme Corp,Prefers email contact,Warm,leads on demand
2,Meena Nair,meena@brightside.io,+91 98111 22233,Brightside,"Call after 6 PM, interested in bulk",Interested,Varah Swamy
3,,,,Unknown Traders,Walk-in enquiry no details,New,Offline
4,Suresh Babu,suresh@,98765,Babu & Sons,Invalid contact details,Junk,Google
5,Lakshmi Devi,lakshmi.devi@mail.com,,Devi Textiles,"Wrong number, do not call again",Bad,meridian tower
6,George Thomas,,+91 9033344455,GT Solutions,Deal finalised payment done,Closed Won,eden park
7,Farida Begum,farida@shop.com,+91 9700099888,Begum Store,No response after multiple calls,Not Reachable,sarjapur plots`,
  },
];

export function sampleToFile(sample: Sample): File {
  return new File([sample.content], sample.filename, { type: 'text/csv' });
}
