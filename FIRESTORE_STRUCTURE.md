# Firebase Firestore Database Structure
## Christhood Ministry Attendance Management System

This document outlines the Firestore database structure for the attendance management system.

---

## Collections Overview

### 1. **services** (Root Collection)
Path: `/services/{serviceId}`

Stores all church service records.

#### Document Fields:
```typescript
{
  id: string;                    // Auto-generated document ID
  serviceDate: Timestamp;        // Date of the service
  serviceType: string;           // Type of service (default: 'Saturday Fellowship')
  totalAttendance: number;       // Total number of people present
  createdAt: Timestamp;          // Document creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
}
```

#### Example Document:
```json
{
  "serviceDate": Timestamp("2026-02-04T00:00:00Z"),
  "serviceType": "Saturday Fellowship",
  "totalAttendance": 150,
  "createdAt": Timestamp("2026-02-04T14:30:00Z"),
  "updatedAt": Timestamp("2026-02-04T14:30:00Z")
}
```

#### Service Type Options:
- `Saturday Fellowship` (default)
- `Sunday Service`
- `Midweek Service`
- `Special Event`

---

### 2. **visitors** (Sub-collection)
Path: `/services/{serviceId}/visitors/{visitorId}`

Stores visitor information for each service as a sub-collection.

#### Document Fields:
```typescript
{
  id: string;                    // Auto-generated document ID
  visitorName: string | null;    // Visitor's name (optional)
  visitorContact: string | null; // Phone number or email (optional)
  visitDate: Timestamp;          // Date of visit (same as service date)
  createdAt: Timestamp;          // Document creation timestamp
}
```

#### Example Document:
```json
{
  "visitorName": "John Doe",
  "visitorContact": "john.doe@email.com",
  "visitDate": Timestamp("2026-02-04T00:00:00Z"),
  "createdAt": Timestamp("2026-02-04T14:35:00Z")
}
```

---

## Data Relationships

```
services (Collection)
├── {serviceId-1} (Document)
│   ├── serviceDate: Timestamp
│   ├── serviceType: string
│   ├── totalAttendance: number
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   └── visitors (Sub-collection)
│       ├── {visitorId-1} (Document)
│       │   ├── visitorName: string
│       │   ├── visitorContact: string
│       │   ├── visitDate: Timestamp
│       │   └── createdAt: Timestamp
│       └── {visitorId-2} (Document)
│           └── ...
├── {serviceId-2} (Document)
│   └── ...
```

---

## Firestore Security Rules

Add these rules in the Firebase Console under Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Services collection
    match /services/{serviceId} {
      // Allow anyone to read service records
      allow read: if true;
      
      // Allow anyone to create service records
      allow create: if true;
      
      // Allow update if the document exists
      allow update: if exists(/databases/$(database)/documents/services/$(serviceId));
      
      // Allow delete (optional - can be restricted)
      allow delete: if true;
      
      // Visitors sub-collection
      match /visitors/{visitorId} {
        // Allow anyone to read visitors
        allow read: if true;
        
        // Allow anyone to create visitor records
        allow create: if true;
        
        // Allow update if the visitor document exists
        allow update: if exists(/databases/$(database)/documents/services/$(serviceId)/visitors/$(visitorId));
        
        // Allow delete
        allow delete: if true;
      }
    }
  }
}
```

### Security Notes:
- **Public Access**: Current rules allow public read/write access
- **Authentication**: For production, add authentication requirements
- **Authorization**: Restrict write access to authenticated users only

---

## Indexes

Firestore automatically creates indexes for simple queries. For composite queries, you may need to create composite indexes.

### Recommended Composite Indexes:

1. **Services by Date (Descending)**
   - Collection: `services`
   - Fields: `serviceDate` (Descending)
   - Status: Auto-created by Firestore

2. **Visitors by Visit Date (Descending)**
   - Collection: `services/{serviceId}/visitors`
   - Fields: `visitDate` (Descending)
   - Status: Auto-created by Firestore

Firestore will prompt you to create any additional indexes if needed when queries are executed.

---

## Query Examples

### Get All Services (Latest First)
```typescript
const q = query(
  collection(db, 'services'),
  orderBy('serviceDate', 'desc')
);
const snapshot = await getDocs(q);
```

### Get Services for a Specific Month
```typescript
const startOfMonth = Timestamp.fromDate(new Date('2026-02-01'));
const endOfMonth = Timestamp.fromDate(new Date('2026-02-28'));

const q = query(
  collection(db, 'services'),
  where('serviceDate', '>=', startOfMonth),
  where('serviceDate', '<=', endOfMonth),
  orderBy('serviceDate', 'desc')
);
const snapshot = await getDocs(q);
```

### Get Visitors for a Specific Service
```typescript
const visitorsRef = collection(db, `services/${serviceId}/visitors`);
const snapshot = await getDocs(visitorsRef);
```

### Add a Service with Visitors
```typescript
// Add service
const serviceRef = await addDoc(collection(db, 'services'), {
  serviceDate: Timestamp.fromDate(new Date()),
  serviceType: 'Saturday Fellowship',
  totalAttendance: 150,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

// Add visitors to the service
const visitorsRef = collection(db, `services/${serviceRef.id}/visitors`);
await addDoc(visitorsRef, {
  visitorName: 'John Doe',
  visitorContact: 'john@example.com',
  visitDate: Timestamp.fromDate(new Date()),
  createdAt: serverTimestamp()
});
```

---

## Data Migration from Supabase

If migrating from Supabase, use the following mapping:

| Supabase Table | Firestore Collection | Notes |
|----------------|---------------------|--------|
| `services` | `services` | Convert DATE to Timestamp |
| `visitors` | `services/{id}/visitors` | Now a sub-collection |

### Timestamp Conversion:
```typescript
// Supabase DATE to Firestore Timestamp
const date = new Date('2026-02-04');
const timestamp = Timestamp.fromDate(date);
```

---

## Best Practices

1. **Use Timestamps**: Always use Firestore `Timestamp` for dates
2. **Server Timestamps**: Use `serverTimestamp()` for creation/update times
3. **Sub-collections**: Visitors are stored as sub-collections for better organization
4. **Batch Operations**: Use batch writes for multiple operations
5. **Pagination**: Implement pagination for large datasets
6. **Offline Support**: Firestore automatically handles offline data

---

## Backup Strategy

### Automated Backups
1. Go to Firebase Console > Firestore Database
2. Click "Usage" tab
3. Enable "Automatic Backups"
4. Configure backup schedule and retention

### Manual Export
Use Firebase CLI:
```bash
gcloud firestore export gs://[BUCKET_NAME]
```

---

## Contact

For technical support or database questions, contact the Christhood Ministry tech team.
