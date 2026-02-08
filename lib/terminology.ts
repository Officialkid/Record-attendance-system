export function getTerminology(orgType: string) {
  const isChurchOrMinistry = orgType === 'Church' || orgType === 'Ministry';

  return {
    event: isChurchOrMinistry ? 'Service' : 'Event',
    Event: isChurchOrMinistry ? 'Service' : 'Event',
    events: isChurchOrMinistry ? 'Services' : 'Events',
    Events: isChurchOrMinistry ? 'Services' : 'Events',
    record: isChurchOrMinistry ? 'Record Service' : 'Record Event',
    add: isChurchOrMinistry ? 'Add Service' : 'Add Event',
    attendance: 'Attendance',
    attendees: isChurchOrMinistry ? 'Attendees' : 'Participants',
    visitor: isChurchOrMinistry ? 'Visitor' : 'Guest',
    visitors: isChurchOrMinistry ? 'Visitors' : 'Guests',
  };
}

export function getDefaultEventTypes(orgType: string): string[] {
  switch (orgType) {
    case 'Church':
    case 'Ministry':
      return [
        'Sunday Service',
        'Saturday Fellowship',
        'Midweek Service',
        'Prayer Meeting',
        'Youth Service',
        'Bible Study',
        'Special Service',
        'Other',
      ];
    case 'NGO':
      return [
        'Community Outreach',
        'Training Workshop',
        'Awareness Campaign',
        'Fundraising Event',
        'Volunteer Meeting',
        'Other',
      ];
    case 'Corporate':
      return [
        'Team Meeting',
        'All-Hands Meeting',
        'Training Session',
        'Conference',
        'Workshop',
        'Seminar',
        'Networking Event',
        'Other',
      ];
    case 'Community Group':
      return [
        'Community Meeting',
        'Group Activity',
        'Social Gathering',
        'Workshop',
        'Other',
      ];
    case 'Event Organizer':
      return [
        'Conference',
        'Concert',
        'Festival',
        'Exhibition',
        'Workshop',
        'Seminar',
        'Networking Event',
        'Other',
      ];
    case 'Educational':
      return [
        'Class Session',
        'Lecture',
        'Seminar',
        'Workshop',
        'Orientation',
        'Graduation',
        'Other',
      ];
    default:
      return [
        'Meeting',
        'Workshop',
        'Event',
        'Gathering',
        'Other',
      ];
  }
}
