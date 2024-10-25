import json
from datetime import datetime, timedelta
import random

def generate_sample_events(start_date, num_days=30):
    events = {}
    
    # Sample event templates
    event_templates = {
        'work': [
            'Team Meeting',
            'Project Deadline',
            'Client Call',
            'Code Review',
            'Sprint Planning'
        ],
        'personal': [
            'Gym',
            'Lunch with Friends',
            'Doctor Appointment',
            'Shopping',
            'Movie Night'
        ],
        'important': [
            'Presentation',
            'Interview',
            'Important Deadline',
            'Flight',
            'Anniversary'
        ],
        'meeting': [
            'Standup',
            'Board Meeting',
            'Department Update',
            'One-on-One',
            'Strategy Meeting'
        ],
        'deadline': [
            'Report Due',
            'Submit Proposal',
            'Tax Deadline',
            'Project Milestone',
            'Document Review'
        ]
    }
    
    # Generate events
    current_date = start_date
    for _ in range(num_days):
        date_key = current_date.strftime('%Y-%m-%d')
        
        # Randomly decide if this date will have events
        if random.random() < 0.7:  # 70% chance of having events
            num_events = random.randint(1, 3)
            events[date_key] = []
            
            for _ in range(num_events):
                category = random.choice(list(event_templates.keys()))
                event_title = random.choice(event_templates[category])
                
                event = {
                    'title': event_title,
                    'description': f'Description for {event_title}',
                    'category': category
                }
                
                events[date_key].append(event)
        
        current_date += timedelta(days=1)
    
    return events

if __name__ == '__main__':
    # Generate events starting from today
    start_date = datetime.now()
    events = generate_sample_events(start_date)
    
    # Save to file
    with open('sample_events.json', 'w') as f:
        json.dump(events, f, indent=2)
    
    print(f"Generated {sum(len(events[date]) for date in events)} events across {len(events)} days")
    print("Events have been saved to 'sample_events.json'")
