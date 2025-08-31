import './style.css'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function createCalendar(year, month) {
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthSection = document.createElement('div');
  monthSection.className = 'month-section';
  monthSection.setAttribute('data-month', month);

  const monthTitle = document.createElement('h2');
  monthTitle.className = 'month-title';
  monthTitle.textContent = `${monthNames[month]}, ${year}`;
  monthSection.appendChild(monthTitle);

  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';

  // Days with has-diary class (opacity: 1) based on Figma design
  const diaryDays = {
    0: [3, 5, 8, 11, 12, 14, 17, 18, 19, 20, 24, 25, 26, 28, 29, 31], // January
    1: [1, 2, 6, 9, 10, 12, 13, 15, 16, 21, 22, 23, 25, 26, 27, 28], // February
    2: Array.from({length: 31}, (_, i) => i + 1) // March (all has-diary)
  };

  for (let i = 0; i < firstDay; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day other-month';
    dayElement.textContent = '';
    calendarGrid.appendChild(dayElement);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.setAttribute('data-day', day);
    
    // Add has-diary class for specific days
    if (diaryDays[month] && diaryDays[month].includes(day)) {
      dayElement.classList.add('has-diary');
    }
    
    // Create span for the day number
    const daySpan = document.createElement('span');
    daySpan.className = 'day-number';
    daySpan.textContent = day;
    dayElement.appendChild(daySpan);
    
    calendarGrid.appendChild(dayElement);
  }

  const totalCells = firstDay + daysInMonth;
  const totalRows = Math.ceil(totalCells / 7);
  const cellsNeeded = totalRows * 7;
  const remainingCells = cellsNeeded - totalCells;
  
  for (let i = 0; i < remainingCells; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day other-month';
    dayElement.textContent = '';
    calendarGrid.appendChild(dayElement);
  }

  monthSection.appendChild(calendarGrid);
  return monthSection;
}

function initCalendar() {
  const container = document.getElementById('calendar-container');
  
  const january2025 = createCalendar(2025, 0);
  const february2025 = createCalendar(2025, 1);
  const march2025 = createCalendar(2025, 2);
  
  container.appendChild(january2025);
  container.appendChild(february2025);
  container.appendChild(march2025);
  
  // Initialize scroll tracking for active dot
  initScrollTracking();
}

function initScrollTracking() {
  const container = document.getElementById('calendar-container');
  const diaryImage = document.getElementById('diary-image');
  
  // Get all diary entries for each month
  const monthSections = container.querySelectorAll('.month-section');
  const diaryEntries = [];
  
  monthSections.forEach((section, monthIndex) => {
    const diaryDays = section.querySelectorAll('.calendar-day.has-diary');
    diaryDays.forEach(day => {
      const dayNumber = parseInt(day.getAttribute('data-day'));
      diaryEntries.push({
        element: day,
        month: monthIndex,
        day: dayNumber,
        offsetTop: day.offsetTop + section.offsetTop
      });
    });
  });
  
  if (diaryEntries.length === 0) return;
  
  // Set initial active and image
  diaryEntries[0].element.classList.add('active');
  updateImage(diaryEntries[0].month, diaryEntries[0].day);
  
  // Handle scroll
  container.addEventListener('scroll', () => {
    const scrollTop = container.scrollTop;
    
    // Find the appropriate month section
    let currentMonthIndex = 0;
    for (let i = 0; i < monthSections.length; i++) {
      if (scrollTop >= monthSections[i].offsetTop - 360) {
        currentMonthIndex = i;
      }
    }
    
    // Get diary entries for current month
    const currentMonthEntries = diaryEntries.filter(entry => entry.month === currentMonthIndex);
    if (currentMonthEntries.length === 0) return;
    
    // Calculate which entry should be active based on scroll position
    const monthSection = monthSections[currentMonthIndex];
    const monthTop = monthSection.offsetTop - 360;
    const monthHeight = monthSection.offsetHeight;
    const scrollInMonth = Math.max(0, scrollTop - monthTop);
    const scrollProgress = Math.min(1, scrollInMonth / monthHeight);
    
    // Determine active index based on scroll progress
    const activeIndex = Math.min(
      currentMonthEntries.length - 1,
      Math.floor(scrollProgress * currentMonthEntries.length)
    );
    
    // Remove all active classes and add to current
    diaryEntries.forEach(entry => entry.element.classList.remove('active'));
    currentMonthEntries[activeIndex].element.classList.add('active');
    
    // Update image based on active date
    updateImage(currentMonthEntries[activeIndex].month, currentMonthEntries[activeIndex].day);
  });
  
  function updateImage(monthIndex, day) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthName = monthNames[monthIndex];
    const imagePath = `/src/image/${day}-${monthName}.jpeg`;
    
    // Check if image exists by trying to load it
    const testImage = new Image();
    testImage.onload = function() {
      diaryImage.src = imagePath;
    };
    testImage.onerror = function() {
      diaryImage.src = '/src/image/default.jpeg';
    };
    testImage.src = imagePath;
  }
}

document.addEventListener('DOMContentLoaded', initCalendar);