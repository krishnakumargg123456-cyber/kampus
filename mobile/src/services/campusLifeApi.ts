import API_BASE_URL from '../config/api';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: 'Hackathon' | 'Cultural Fest' | 'Workshop' | 'Seminar' | 'Sports' | 'Technical';
  organizer: string;
  organizerRole?: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  registeredCount: number;
  prizePool?: string;
  image: string;
  featured: boolean;
  registrationOpen: boolean;
  tags: string[];
  isRegistered?: boolean;
  spotsLeft?: number;
}

export interface CampusClub {
  id: string;
  name: string;
  category: 'Technical' | 'Cultural' | 'Literary' | 'Sports' | 'Social' | 'Entrepreneurship';
  description: string;
  leadName: string;
  leadRole: string;
  membersCount: number;
  establishedYear: number;
  meetingSchedule: string;
  venue: string;
  logo: string;
  featured: boolean;
  activeProjects: string[];
  isMember?: boolean;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  department: string;
  publishedBy: string;
  verifiedOfficial: boolean;
  priority: 'Urgent' | 'High' | 'Normal';
  date: string;
  content: string;
  category: 'Academic' | 'Hostel' | 'Examination' | 'Facilities' | 'General';
  attachmentName?: string;
}

export interface LostAndFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'Lost' | 'Found';
  category: 'Electronics' | 'IDs & Cards' | 'Books & Notes' | 'Accessories' | 'Keys' | 'Other';
  location: string;
  dateReported: string;
  status: 'Open' | 'Resolved' | 'Claimed';
  reporterId: string;
  reporterName: string;
  reporterContact?: string;
  imageUrl?: string;
}

export interface CampusLifeOverview {
  featuredEvent: CampusEvent | null;
  events: CampusEvent[];
  clubs: CampusClub[];
  announcements: CampusAnnouncement[];
  lostAndFound: LostAndFoundItem[];
  stats: {
    totalEvents: number;
    totalClubs: number;
    activeAnnouncements: number;
    openLostFound: number;
    myRegistrationsCount?: number;
    myClubsCount?: number;
  };
}

const getHeaders = (token?: string | null, userId?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};

export const campusLifeApi = {
  async getOverview(token?: string | null, userId?: string | null): Promise<CampusLifeOverview> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/campus-life/overview${qs}`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) {
      throw new Error(`Failed to load campus life overview: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getEvents(
    category?: string,
    query?: string,
    token?: string | null,
    userId?: string | null
  ): Promise<CampusEvent[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (query) params.append('q', query);
    if (userId) params.append('userId', userId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/campus-life/events${qs}`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) throw new Error('Failed to load events.');
    const data = await res.json();
    return data.events || [];
  },

  async registerForEvent(
    eventId: string,
    userName: string,
    userEmail?: string,
    token?: string | null,
    userId?: string | null
  ): Promise<{ success: boolean; message: string; event: CampusEvent }> {
    const res = await fetch(`${API_BASE_URL}/api/campus-life/events/${eventId}/register`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userName, userEmail, userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to register for event.');
    }
    return json;
  },

  async cancelEventRegistration(
    eventId: string,
    token?: string | null,
    userId?: string | null
  ): Promise<{ success: boolean; event: CampusEvent }> {
    const res = await fetch(`${API_BASE_URL}/api/campus-life/events/${eventId}/cancel`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to cancel registration.');
    }
    return json;
  },

  async getClubs(
    category?: string,
    token?: string | null,
    userId?: string | null
  ): Promise<CampusClub[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (userId) params.append('userId', userId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/campus-life/clubs${qs}`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) throw new Error('Failed to load clubs.');
    const data = await res.json();
    return data.clubs || [];
  },

  async joinClub(
    clubId: string,
    userName: string,
    token?: string | null,
    userId?: string | null
  ): Promise<{ success: boolean; message: string; club: CampusClub }> {
    const res = await fetch(`${API_BASE_URL}/api/campus-life/clubs/${clubId}/join`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userName, userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to join club.');
    }
    return json;
  },

  async getAnnouncements(
    token?: string | null,
    userId?: string | null
  ): Promise<CampusAnnouncement[]> {
    const res = await fetch(`${API_BASE_URL}/api/campus-life/announcements`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) throw new Error('Failed to load announcements.');
    const data = await res.json();
    return data.announcements || [];
  },

  async getLostAndFound(
    type?: string,
    token?: string | null,
    userId?: string | null
  ): Promise<LostAndFoundItem[]> {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/campus-life/lost-found${qs}`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) throw new Error('Failed to load lost and found items.');
    const data = await res.json();
    return data.items || [];
  },

  async reportLostAndFound(
    data: {
      title: string;
      description: string;
      type: 'Lost' | 'Found';
      category: string;
      location: string;
      reporterName: string;
      reporterContact?: string;
    },
    token?: string | null,
    userId?: string | null
  ): Promise<LostAndFoundItem> {
    const res = await fetch(`${API_BASE_URL}/api/campus-life/lost-found`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ ...data, userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to report item.');
    }
    return json.item;
  },

  async resolveLostAndFound(
    itemId: string,
    token?: string | null,
    userId?: string | null
  ): Promise<LostAndFoundItem> {
    const res = await fetch(`${API_BASE_URL}/api/campus-life/lost-found/${itemId}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to resolve item.');
    }
    return json.item;
  },
};
