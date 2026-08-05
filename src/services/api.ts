// Relative — same-origin, proxied by the property server (server/index.js) which
// attaches the auth token from the httpOnly session cookie before forwarding.
const API_URL = '/api';

export interface CheckIn {
  _id: string;
  bookingId: any;
  guestId: any;
  status: string;
  approvalStatus: string;
  guestDocuments: Array<{
    guestNumber: number;
    guestName?: string;
    idFrontUrl: string;
    idBackUrl: string;
    idType: string;
    uploadedAt: string;
    verified: boolean;
  }>;
  totalGuests: number;
  documentsCompleted: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  guestNotes?: string;
  bookingData?: {
    primaryGuestName: string;
    bookingId: string;
    roomType: string;
    propertyId: string;
  };
}

export interface Experience {
  _id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  imageUrl: string;
  images: string[];
  duration: {
    value: number;
    unit: string;
  };
  location?: {
    name?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  pricing: {
    basePrice: number;
    currency: string;
    pricePerPerson: boolean;
  };
  groupSize: {
    min: number;
    max: number;
  };
  inclusions: string[];
  exclusions: string[];
  requirements?: string[];
  timeSlots: Array<{
    time: string;
    capacity: number;
    available: number;
    priceModifier?: number;
  }>;
  availability?: 'daily' | 'specific-days' | 'on-request';
  specificDays?: number[];
  advanceBookingRequired?: {
    value: number;
    unit: 'hours' | 'days';
  };
  cancellationPolicy?: string;
  isActive: boolean;
  isFeatured: boolean;
  isSpotlight: boolean;
  isCrafted: boolean;
  propertyId: string;
  tags?: string[];
  spotlightOrder?: number;
  craftedOrder?: number;
}

export interface Booking {
  _id: string;
  bookingId: string;
  primaryGuestName: string;
  numberOfGuests: number;
  arrivalDate: string;
  checkoutDate: string;
  propertyName: string;
  roomType: string;
  roomNumber?: string;
  checkInStatus: string;
  bookingStatus: string;
  specialRequests?: string;
  totalAmount?: number;
}

export interface Guest {
  _id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  bookingToken?: string;
  guestType: string;
  totalVisits: number;
  lastVisit?: string;
  roomNumber?: string;
  checkInStatus?: string;
  bookingName?: string;
  numberOfGuests?: number;
  emailOptIn?: boolean;
}

export interface AppBanner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  bannerType: string;
  targetApp: string;
  actionType: string;
  actionValue?: string;
  propertyId: string;
  isActive: boolean;
  priority: number;
  tags: string[];
  buttonText: string;
  isCustom: boolean;
  displayFrom?: string;
  displayUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpaFacilityAPI {
  _id: string;
  name: string;
  subtitle?: string;
  description?: string;
  operatingHours?: string;
  advanceBooking?: string;
  listingImage?: string;
  detailImage?: string;
  isActive: boolean;
  propertyId: string;
  therapistsAvailable?: number;
  categories: Array<{
    _id: string;
    name: string;
    treatments: Array<{
      _id: string;
      name: string;
      description?: string;
      price: number;
      duration: number;
      imageUrl?: string;
      subtitle?: string;
      pricingLabel?: string;
      capacityMin?: number;
      capacityMax?: number;
      isActive?: boolean;
      timeSlots?: Array<{ label: string; startTime: string }>;
      blockedDates?: string[];
    }>;
  }>;
}

export interface SpaBookingAPI {
  _id: string;
  bookingId: string;
  spaFacilityId: string;
  treatmentId: string;
  treatmentName: string;
  categoryName?: string;
  guestId?: string;
  mainBookingId?: string;
  guestName: string;
  room?: string;
  date: string;
  timeSlot: string;
  duration?: number;
  price: number;
  propertyId: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  specialRequests?: string;
  adminNotes?: string;
  createdAt?: string;
}

export interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  propertyId: string;
  propertyName?: string;
  phone?: string;
  permissions: {
    canApproveCheckIns: boolean;
    canManageExperiences: boolean;
    canManageBookings: boolean;
    canManageGuests: boolean;
    canViewAnalytics: boolean;
    canManageStaff: boolean;
  };
  isActive: boolean;
}

export interface PropertySettings {
  propertyId: string;
  checkInTime: string;
  checkOutTime: string;
  infantCategory: { enabled: boolean; ageMin: number; ageMax: number };
  childCategory: { enabled: boolean; ageMin: number; ageMax: number };
  notificationEmails: string[];
}

class DashboardAPI {
  private baseURL = API_URL;

  // Auth is handled by the session cookie (httpOnly, sent automatically with
  // `credentials: 'include'`) — the property server attaches the real bearer
  // token when it proxies to the backend, so no token ever lives in client JS.
  private getHeaders(): HeadersInit {
    return { "Content-Type": "application/json" };
  }

  private async request(url: string, options: RequestInit = {}, timeoutMs = 30_000): Promise<Response> {
    return fetch(url, { ...options, credentials: 'include', signal: AbortSignal.timeout(timeoutMs) });
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return response;
  }

  // ==================== AUTH ====================
  // Login itself is handled by AuthContext via /session/login (sets the httpOnly
  // cookie) — not proxied through here.

  async resetStaffPassword(staffId: string, newPassword: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/staff/${staffId}/password`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    await this.handleResponse(response);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to reset password");
  }

  // ==================== CHECK-IN HUB ====================
  async getDailyArrivals(date?: string, propertyId?: string): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (propertyId && propertyId !== 'default') params.append('propertyId', propertyId);

    const response = await this.request(`${this.baseURL}/dashboard/checkin/arrivals?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve daily arrivals');
    }

    return data.data;
  }

  async getSubmittedCheckIns(propertyId?: string, approvalStatus?: string): Promise<CheckIn[]> {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (approvalStatus) params.append('approvalStatus', approvalStatus);

    const response = await this.request(`${this.baseURL}/dashboard/checkin/submitted?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve submitted check-ins');
    }

    return data.data;
  }

  async reviewCheckIn(
    checkInId: string,
    reviewData: {
      approvalStatus: 'approved' | 'rejected' | 'needs-resubmission';
      reviewNotes?: string;
      staffId: string;
    }
  ): Promise<CheckIn> {
    const response = await this.request(`${this.baseURL}/dashboard/checkin/${checkInId}/review`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(reviewData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to review check-in');
    }

    return data.data;
  }

  // ==================== EXPERIENCE HUB ====================
  async getAllExperiences(propertyId?: string): Promise<Experience[]> {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);

    const response = await this.request(`${this.baseURL}/dashboard/experiences?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve experiences');
    }

    return data.data;
  }

  async getExperienceBookings(filters?: {
    date?: string;
    propertyId?: string;
    status?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.status) params.append('status', filters.status);

    const response = await this.request(`${this.baseURL}/dashboard/experiences/bookings?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve experience bookings');
    }

    return data.data;
  }

  async createManualBooking(bookingData: {
    experienceId: string;
    date: string;
    timeSlot: string;
    numberOfGuests: number;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    adminNotes?: string;
    mainStayBookingId?: string;
  }): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/experiences/bookings/manual`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create manual booking');
    }

    return data.data;
  }

  async createExperience(experienceData: Partial<Experience>): Promise<Experience> {
    const response = await this.request(`${this.baseURL}/dashboard/experiences`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(experienceData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create experience');
    }

    return data.data;
  }

  async updateExperience(experienceId: string, experienceData: Partial<Experience>): Promise<Experience> {
    const response = await this.request(`${this.baseURL}/dashboard/experiences/${experienceId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(experienceData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update experience');
    }

    return data.data;
  }

  async deleteExperience(experienceId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/experiences/${experienceId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete experience');
    }
  }

  // ==================== GUEST MANAGEMENT ====================
  async getAllGuests(filters?: { search?: string; guestType?: string; checkInDate?: string; checkOutDate?: string; propertyId?: string }): Promise<Guest[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.guestType) params.append('guestType', filters.guestType);
    if (filters?.checkInDate) params.append('checkInDate', filters.checkInDate);
    if (filters?.checkOutDate) params.append('checkOutDate', filters.checkOutDate);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);

    const response = await this.request(`${this.baseURL}/dashboard/guests?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve guests');
    }

    return data.data;
  }

  async getGuestByBookingId(bookingId: string): Promise<{ primaryGuestName: string; propertyName: string; bookingId: string; arrivalDate?: string; checkoutDate?: string; roomType?: string; roomNumber?: string; guestId?: string; _id?: string } | null> {
    const response = await this.request(`${this.baseURL}/dashboard/guests/by-booking/${encodeURIComponent(bookingId)}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) return null;
    return data.data;
  }

  async addGuest(guestData: Partial<Guest> & {
    arrivalDate?: string;
    checkoutDate?: string;
    roomType?: string;
    roomNumber?: string;
    totalAmount?: number;
    specialRequests?: string;
  }): Promise<Guest> {
    const response = await this.request(`${this.baseURL}/dashboard/guests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(guestData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to add guest');
    }

    return data.data;
  }

  async bulkImportGuests(guests: Partial<Guest>[]): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/guests/bulk-import`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ guests }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to import guests');
    }
  }

  async reviewGuestID(guestId: string, status: 'verified' | 'rejected', rejectionReason?: string): Promise<Guest> {
    const response = await this.request(`${this.baseURL}/dashboard/guests/${guestId}/review`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, rejectionReason }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to review guest ID');
    }

    return data.data;
  }

  async updateGuest(guestId: string, guestData: Partial<Guest> & {
    arrivalDate?: string;
    checkoutDate?: string;
  }): Promise<Guest> {
    const response = await this.request(`${this.baseURL}/dashboard/guests/${guestId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(guestData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update guest');
    }

    return data.data;
  }

  async deleteGuest(guestId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/guests/${guestId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete guest');
    }
  }

  // ==================== STAFF MANAGEMENT ====================
  async getAllStaff(filters?: {
    role?: string;
    department?: string;
    propertyId?: string;
    isActive?: boolean;
  }): Promise<Staff[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const response = await this.request(`${this.baseURL}/dashboard/staff?${params}`, {
      headers: this.getHeaders(),
    });
    await this.handleResponse(response);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve staff');
    }

    return data.data;
  }

  async addStaff(staffData: Partial<Staff>): Promise<Staff> {
    const response = await this.request(`${this.baseURL}/dashboard/staff`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(staffData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to add staff');
    }

    return data.data;
  }

  async updateStaff(staffId: string, staffData: Partial<Staff>): Promise<Staff> {
    const response = await this.request(`${this.baseURL}/dashboard/staff/${staffId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(staffData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update staff');
    }

    return data.data;
  }

  async deleteStaff(staffId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/staff/${staffId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to delete staff');
  }

  // ==================== RESTAURANT MANAGEMENT ====================
  async getAllRestaurants(propertyId?: string, isActive?: boolean): Promise<any[]> {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (isActive !== undefined) params.append('isActive', String(isActive));

    const response = await this.request(`${this.baseURL}/dashboard/restaurants?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve restaurants');
    }

    return data.data;
  }

  async createRestaurant(restaurantData: any): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/restaurants`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(restaurantData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create restaurant');
    }

    return data.data;
  }

  async updateRestaurant(restaurantId: string, restaurantData: any): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/restaurants/${restaurantId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(restaurantData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update restaurant');
    }

    return data.data;
  }

  async deleteRestaurant(restaurantId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/restaurants/${restaurantId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to delete facility');
  }

  async uploadDiningImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.request(`${this.baseURL}/dashboard/restaurants/upload-image`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to upload image');
    return data.data;
  }

  async getDiningReservations(filters?: { propertyId?: string; date?: string; facilityId?: string; facilityType?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.facilityId) params.append('facilityId', filters.facilityId);
    if (filters?.facilityType) params.append('facilityType', filters.facilityType);
    if (filters?.status) params.append('status', filters.status);
    const response = await this.request(`${this.baseURL}/dashboard/restaurants/reservations?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to retrieve reservations');
    return data.data;
  }

  async cancelExperienceBooking(bookingId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/experiences/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to cancel booking');
  }

  async cancelDiningReservation(reservationId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/restaurants/reservations/${reservationId}/cancel`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to cancel reservation');
  }

  async createManualDiningReservation(reservationData: any): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/restaurants/reservations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reservationData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to create reservation');
    return data.data;
  }

  // ==================== EXPERIENCE IMAGE UPLOAD ====================
  async uploadExperienceImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.request(`${this.baseURL}/dashboard/experiences/upload-image`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to upload experience image');
    }
    return data.data;
  }

  async uploadSpaImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.request(`${this.baseURL}/dashboard/spa/upload-image`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to upload spa image');
    }
    return data.data;
  }

  // ==================== APP BANNERS ====================
  async uploadBannerImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.request(`${this.baseURL}/dashboard/banners/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to upload banner image');
    }
    return data.data;
  }

  async getAllBanners(filters?: { propertyId?: string; isActive?: boolean; bannerType?: string }): Promise<AppBanner[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.bannerType) params.append('bannerType', filters.bannerType);

    const response = await this.request(`${this.baseURL}/dashboard/banners?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve banners');
    }

    return data.data;
  }

  async createBanner(bannerData: any): Promise<AppBanner> {
    const response = await this.request(`${this.baseURL}/dashboard/banners`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bannerData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create banner');
    }

    return data.data;
  }

  async updateBanner(bannerId: string, bannerData: any): Promise<AppBanner> {
    const response = await this.request(`${this.baseURL}/dashboard/banners/${bannerId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(bannerData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update banner');
    }

    return data.data;
  }

  async deleteBanner(bannerId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/banners/${bannerId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete banner');
    }
  }

  // ==================== SPA MANAGEMENT ====================
  async getAllSpaFacilities(propertyId?: string): Promise<SpaFacilityAPI[]> {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);

    const response = await this.request(`${this.baseURL}/dashboard/spa?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve spa facilities');
    }

    return data.data;
  }

  async createSpaFacility(facilityData: any): Promise<SpaFacilityAPI> {
    const response = await this.request(`${this.baseURL}/dashboard/spa`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(facilityData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create spa facility');
    }

    return data.data;
  }

  async updateSpaFacility(facilityId: string, facilityData: any): Promise<SpaFacilityAPI> {
    const response = await this.request(`${this.baseURL}/dashboard/spa/${facilityId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(facilityData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update spa facility');
    }

    return data.data;
  }

  async deleteSpaFacility(facilityId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/spa/${facilityId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete spa facility');
    }
  }

  // ==================== SPA BOOKINGS ====================
  async getSpaBookings(filters?: { propertyId?: string; date?: string; status?: string }): Promise<SpaBookingAPI[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    const response = await this.request(`${this.baseURL}/dashboard/spa/bookings?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to retrieve spa bookings');
    return data.data;
  }

  async createManualSpaBooking(bookingData: Partial<SpaBookingAPI> & { spaFacilityId: string; treatmentId: string; treatmentName: string; guestName: string; date: string; timeSlot: string; price: number; propertyId: string }): Promise<SpaBookingAPI> {
    const response = await this.request(`${this.baseURL}/dashboard/spa/bookings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bookingData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to create spa booking');
    return data.data;
  }

  async updateSpaBookingStatus(bookingId: string, status: SpaBookingAPI['status'], adminNotes?: string): Promise<SpaBookingAPI> {
    const response = await this.request(`${this.baseURL}/dashboard/spa/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, adminNotes }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to update booking status');
    return data.data;
  }

  // ==================== ANALYTICS ====================
  async getAnalytics(filters?: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await this.request(`${this.baseURL}/dashboard/analytics?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve analytics');
    }

    return data.data;
  }

  // ==================== SERVICE REQUESTS ====================

  async getRequests(status?: string, department?: string, propertyId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (department) params.append('department', department);
    if (propertyId) params.append('propertyId', propertyId);

    const response = await this.request(`${this.baseURL}/dashboard/requests?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to retrieve requests');
    return data.data;
  }

  async updateRequestStatus(
    requestId: string,
    update: { status: string; assignee?: string; eta?: string; notes?: string }
  ): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/requests/${requestId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(update)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to update request');
    return data.data;
  }

  async addRequestReply(requestId: string, body: string, sentBy?: string): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/requests/${requestId}/reply`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ body, sentBy: sentBy || 'Front Desk' })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to add reply');
    return data.data;
  }

  // ==================== TRANSPORT HUB ====================

  async getTransportSettings(propertyId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    const response = await this.request(`${this.baseURL}/dashboard/transport?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to retrieve transport settings');
    return data.data;
  }

  async updateTransportSettings(settings: any): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/transport`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to update transport settings');
    return data.data;
  }

  async getTransportBookings(filters?: { propertyId?: string; checkInDate?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.checkInDate) params.append('checkInDate', filters.checkInDate);
    const response = await this.request(`${this.baseURL}/dashboard/transport/bookings?${params}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to retrieve transport bookings');
    return data.data;
  }

  async createManualTransportBooking(data: { mainStayBookingId: string; amount: number; propertyId: string }): Promise<any> {
    const response = await this.request(`${this.baseURL}/dashboard/transport/bookings/manual`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'Failed to create transport booking');
    return json.data;
  }

  async cancelTransportBooking(bookingId: string): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/transport/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to cancel transport booking');
  }

  async getTransportUnseenCount(propertyId = 'default'): Promise<number> {
    const response = await this.request(`${this.baseURL}/dashboard/transport/bookings/unseen-count?propertyId=${propertyId}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to get unseen count');
    return data.data.count as number;
  }

  async markTransportBookingsSeen(propertyId = 'default'): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/transport/bookings/mark-seen`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ propertyId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to mark bookings as seen');
  }

  // ==================== PROPERTY SETTINGS ====================

  async getPropertySettings(propertyId = 'default'): Promise<PropertySettings> {
    const response = await this.request(`${this.baseURL}/dashboard/property-settings?propertyId=${propertyId}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch property settings');
    return data.data;
  }

  async updatePropertySettings(updates: Partial<PropertySettings>, propertyId = 'default'): Promise<PropertySettings> {
    const response = await this.request(`${this.baseURL}/dashboard/property-settings?propertyId=${propertyId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to update property settings');
    return data.data;
  }

  // ==================== GUEST NOTIFICATIONS ====================

  async createGuestNotification(payload: { guestId: string; title: string; message: string; type?: string; relatedId?: string; relatedType?: string }): Promise<void> {
    const response = await this.request(`${this.baseURL}/dashboard/notifications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to create notification');
  }
}

export const dashboardAPI = new DashboardAPI();
