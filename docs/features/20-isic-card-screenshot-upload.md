# ISIC Card Screenshot Upload Feature

## Overview
After a user successfully links their ISIC card through the profile setup, they see an "Upload Card Screenshot" button. Clicking this button opens a modal where they can upload a screenshot of their physical/digital ISIC card. The system extracts key fields from the screenshot using on-device OCR (privacy-first) and optionally uploads the data to the backend for verification and storage.

## User Flow

### 1. ISIC Profile Link Success
- User successfully links their ISIC card through the profile setup form
- Success message displays with a green checkmark
- "Upload Card Screenshot" button appears with explanatory text
- User clicks the button to open `ISICCardUploadModal`

### 2. Screenshot Upload
- User clicks "Upload Screenshot" button
- File picker opens (accepts .png, .jpg, .jpeg, .webp)
- Image preview displays after selection
- Maximum file size: 5MB

### 3. On-Device OCR Processing
**Privacy-First Approach:**
- All OCR processing happens **on-device** using Tesseract.js
- No image data sent to server by default
- User has full control over what gets uploaded

**Extracted Fields:**
- Card Number (e.g., "123456789")
- Full Name
- Date of Birth
- Expiry Date
- Institution/University Name
- Card Type (Physical/Digital)

### 4. Field Review & Edit
- Extracted fields displayed in editable form
- User can correct any OCR mistakes
- Real-time validation (e.g., card number format, date validation)
- Clear error messages for invalid fields

### 5. Optional Server Upload
**Privacy Controls:**
- Checkbox: "Save to my account for faster verification"
- Default: **Unchecked** (privacy-first)
- If checked: Sends extracted data + optional screenshot to backend
- If unchecked: Data stays on-device only

### 6. Completion
- Success toast notification
- Modal closes automatically
- User returns to card management page

## Technical Architecture

### Frontend Components

#### 1. ISICCardUploadModal
**File:** `src/features/cards/components/ISICCardUploadModal.tsx`

**Props:**
```typescript
interface ISICCardUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
}
```

**Features:**
- Multi-step wizard (Upload → Process → Review → Complete)
- Drag-and-drop file upload
- Image preview with zoom
- Progress indicator during OCR
- Field validation with error messages

#### 2. OCRProcessor
**File:** `src/features/cards/utils/ocrProcessor.ts`

**Responsibilities:**
- Initialize Tesseract.js worker
- Process image and extract text
- Parse text into structured fields using regex patterns
- Handle errors and timeouts

**Key Functions:**
```typescript
async function extractISICFields(imageFile: File): Promise<ISICCardData>
function parseCardNumber(text: string): string | null
function parseExpiryDate(text: string): Date | null
```

#### 3. ISICCardFields Component
**File:** `src/features/cards/components/ISICCardFields.tsx`

**Features:**
- Editable form fields for all extracted data
- Real-time validation with Zod schema
- Input masking (card number, date formats)
- Error display for invalid fields

### Backend Implementation

#### 1. Database Schema
**Table:** `isic_card_metadata`

```sql
CREATE TABLE isic_card_metadata (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    virtual_card_id INTEGER REFERENCES virtual_cards(id),
    card_number VARCHAR(50),
    full_name VARCHAR(255),
    date_of_birth DATE,
    expiry_date DATE,
    institution VARCHAR(255),
    card_type VARCHAR(20), -- 'physical' or 'digital'
    screenshot_url TEXT, -- Optional S3/storage URL
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_isic_user ON isic_card_metadata(user_id);
CREATE INDEX idx_isic_card ON isic_card_metadata(virtual_card_id);
```

#### 2. API Endpoints

**POST /api/isic/upload**
- Upload ISIC card metadata
- Optional: Upload screenshot to object storage
- Returns: Card metadata ID

**Request Body:**
```json
{
  "virtualCardId": "123",
  "cardData": {
    "cardNumber": "123456789",
    "fullName": "John Doe",
    "dateOfBirth": "2000-01-15",
    "expiryDate": "2026-12-31",
    "institution": "Sofia University",
    "cardType": "physical"
  },
  "uploadScreenshot": true,
  "screenshotBase64": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "verificationStatus": "pending"
  }
}
```

**GET /api/isic/metadata/:cardId**
- Get ISIC metadata for a virtual card
- Returns: Card metadata (excludes screenshot URL unless verified)

**PATCH /api/isic/metadata/:id**
- Update ISIC card metadata
- User can correct fields after initial upload

#### 3. Flask Blueprint
**File:** `backend/app/blueprints/isic_upload.py`

**Routes:**
- `/upload` - Upload card metadata
- `/metadata/<card_id>` - Get metadata
- `/metadata/<id>` - Update metadata
- `/verify/<id>` - Admin endpoint to verify card

### Security & Privacy

#### Privacy-First Design
1. **On-Device Processing:**
   - Tesseract.js runs entirely in browser
   - No image sent to server by default
   - User explicit consent required for upload

2. **Data Minimization:**
   - Only essential fields extracted
   - Screenshot upload is optional
   - User can delete uploaded data anytime

3. **Consent Management:**
   - Clear privacy notice before upload
   - Checkbox for server upload (opt-in)
   - Right to delete uploaded data

#### Security Measures
1. **File Upload Security:**
   - File type validation (images only)
   - File size limit (5MB max)
   - Malware scanning (if uploaded to server)

2. **Data Protection:**
   - HTTPS-only transmission
   - Encrypted storage for screenshots
   - JWT authentication required

3. **Access Control:**
   - Users can only access their own data
   - Admin-only verification endpoints
   - Audit logging for sensitive operations

### OCR Implementation Details

#### Tesseract.js Configuration
```typescript
const worker = await createWorker({
  logger: (m) => console.log(m), // Progress updates
  errorHandler: (err) => console.error(err)
});

await worker.loadLanguage('eng');
await worker.initialize('eng');
await worker.setParameters({
  tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz- /',
  tessedit_pageseg_mode: PSM.SPARSE_TEXT
});
```

#### Field Extraction Patterns

**Card Number:**
- Pattern: `/\b\d{8,10}\b/`
- Validation: 8-10 digits

**Expiry Date:**
- Patterns: `MM/YYYY`, `MM-YYYY`, `YYYY-MM`
- Validation: Future date, reasonable range (1-10 years)

**Full Name:**
- Pattern: `/[A-Z][a-z]+ [A-Z][a-z]+/`
- Validation: At least 2 words, capitalized

**Institution:**
- Keywords: "University", "College", "Institute"
- Pattern: Context-based extraction

### User Experience

#### Loading States
1. **Uploading Image:** Spinner with "Uploading..." text
2. **Processing OCR:** Progress bar with percentage
3. **Extracting Fields:** "Analyzing card data..."
4. **Saving:** "Saving to your account..."

#### Error Handling
1. **File Too Large:** "Image must be under 5MB"
2. **Invalid Format:** "Please upload a PNG, JPG, or WEBP image"
3. **OCR Failed:** "Could not read card. Please try a clearer image"
4. **Network Error:** "Could not save. Please check your connection"

#### Success Messages
- "ISIC card linked successfully! ✅"
- "Card data extracted and saved"
- "You can update this information anytime in settings"

### Integration Points

#### 1. ISIC Profile Setup
**File:** `src/features/isic/components/ISICProfileSetup.tsx`

```typescript
const [isLinked, setIsLinked] = useState(false);
const [showUploadModal, setShowUploadModal] = useState(false);

const linkMutation = useMutation({
  mutationFn: (data: typeof formData) => isicAPI.linkProfile(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['isic-profile'] });
    toast.success('ISIC card linked successfully!');
    setIsLinked(true); // Show success state with upload button
  }
});

// Success state UI:
{isLinked && (
  <div>
    <div className="success-message">
      ISIC Card Linked Successfully!
    </div>
    <Button onClick={() => setShowUploadModal(true)}>
      Upload Card Screenshot
    </Button>
  </div>
)}

<ISICCardUploadModal
  isOpen={showUploadModal}
  onClose={() => setShowUploadModal(false)}
  cardId=""
/>
```

#### 2. Settings Page
- Add section to view/edit ISIC card data
- Option to upload new screenshot
- Delete uploaded data button

#### 3. Card Details Page
- Show ISIC verification status badge
- Link to edit ISIC metadata
- Display extracted fields (if available)

### Future Enhancements

1. **Multi-Language OCR:**
   - Support for non-Latin characters
   - Bulgarian language support

2. **QR Code Scanning:**
   - Extract data from ISIC QR codes
   - Faster and more accurate

3. **Real-Time Verification:**
   - Verify card number with ISIC API
   - Instant verification badge

4. **Machine Learning:**
   - Custom ML model for ISIC cards
   - Higher accuracy than generic OCR

5. **Mobile App Integration:**
   - Camera capture instead of file upload
   - Instant processing on mobile

### Testing Checklist

- [ ] File upload works with all supported formats
- [ ] File size validation prevents >5MB uploads
- [ ] OCR extracts card number correctly
- [ ] OCR extracts name correctly
- [ ] OCR extracts expiry date correctly
- [ ] Field validation catches invalid data
- [ ] Privacy checkbox controls server upload
- [ ] Backend stores data correctly
- [ ] Users can edit extracted fields
- [ ] Screenshot upload is optional
- [ ] Modal closes after successful upload
- [ ] Error messages display correctly
- [ ] Loading states show during processing
- [ ] Works on desktop Chrome/Firefox/Safari
- [ ] Works on mobile Safari/Chrome
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: Screen reader compatible

### Dependencies

**Frontend:**
- `tesseract.js` - OCR processing (on-device)
- `react-dropzone` - Drag-and-drop file upload
- `react-hook-form` - Form management
- `zod` - Validation schema

**Backend:**
- `Pillow` (PIL) - Optional server-side image processing
- `boto3` - AWS S3 for screenshot storage (optional)
- SQLAlchemy models for database

### Performance Considerations

1. **OCR Processing Time:**
   - Average: 3-5 seconds for 1080p image
   - Show progress indicator
   - Allow cancellation

2. **Image Optimization:**
   - Resize large images before OCR
   - Convert to grayscale for better accuracy
   - Compress before upload (if enabled)

3. **Bundle Size:**
   - Tesseract.js: ~2MB (lazy load)
   - Load only when modal opens
   - Use CDN for language data

### Accessibility

- Proper ARIA labels for all inputs
- Keyboard navigation support
- Screen reader announcements for state changes
- High contrast mode support
- Focus management in modal
- Alt text for uploaded images

## Conclusion

This feature enhances the UniPay experience by streamlining ISIC card verification while maintaining strict privacy standards. The on-device OCR approach ensures user data remains private by default, with server upload as an optional convenience feature.
