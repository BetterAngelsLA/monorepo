document.addEventListener('DOMContentLoaded', () => {
  // Loop through all widget containers.
  document.querySelectorAll('.time-input-widget').forEach((container) => {
    const input = container.querySelector('.times-input');
    const clock = container.querySelector('.clock');

    // Use data attributes or container-specific IDs if needed.
    const barWidth = 700;
    const barHeight = 40;
    const segments = 24;
    const sliceCount = segments * 2;
    let isMouseDown = false;
    let dragMode = null;

    // Initialize the input field value if needed.

    input.addEventListener('click', () => {
      clock.classList.toggle('cansee');
    });

    function toggleTime(timeStr) {
      let match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      let match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (match12) {
        let hours = parseInt(match12[1]);
        let minutes = match12[2];
        let period = match12[3].toUpperCase();
        if (period === 'AM' && hours === 12) {
          hours = 0;
        } else if (period === 'PM' && hours !== 12) {
          hours += 12;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      } else if (match24) {
        let hours = parseInt(match24[1]);
        let minutes = match24[2];
        let period = hours >= 12 ? 'PM' : 'AM';
        if (hours === 0) {
          hours = 12;
        } else if (hours > 12) {
          hours -= 12;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}${period}`;
      } else {
        return 'Invalid time format';
      }
    }

    function updateTimeInput() {
      const selectedSlices = clock.querySelectorAll('.slice.selected');
      const intervals = Array.from(selectedSlices).map((slice) => {
        const [startStr, endStr] = slice.getAttribute('data-hour').split('-');
        return { start: parseFloat(startStr), end: parseFloat(endStr) };
      });
      intervals.sort((a, b) => a.start - b.start);
      const merged = [];
      intervals.forEach((interval) => {
        if (merged.length === 0) {
          merged.push(interval);
        } else {
          const last = merged[merged.length - 1];
          if (last.end === interval.start) {
            last.end = interval.end;
          } else {
            merged.push(interval);
          }
        }
      });
      const formatted = merged.map(
        (interval) =>
          `${toggleTime(
            interval.start % 1 === 0
              ? interval.start + ':00'
              : parseInt(interval.start) + ':30'
          )}-${toggleTime(
            interval.end % 1 === 0
              ? interval.end + ':00'
              : parseInt(interval.end) + ':30'
          )}`
      );
      input.value = formatted.join(', ');
    }

    function updateWheelFromInput() {
      const inputVal = input.value;
      const intervals = inputVal
        .split(',')
        .map((rangeStr) => rangeStr.trim())
        .filter((rangeStr) => rangeStr.length > 0)
        .map((rangeStr) => {
          const parts = rangeStr.split('-');
          if (parts.length !== 2) return null;
          return {
            start: parts[0].includes(':00')
              ? parseInt(toggleTime(parts[0]), 10)
              : parseInt(toggleTime(parts[0]), 10) + 0.5,
            end: parts[0].includes(':00')
              ? parseInt(toggleTime(parts[1]), 10)
              : parseInt(toggleTime(parts[1]), 10) + 0.5,
          };
        })
        .filter((x) => x !== null);
      clock.querySelectorAll('.slice').forEach((slice) => {
        const dataHour = slice.getAttribute('data-hour');
        const parts = dataHour.split('-');
        const sliceStart = parseFloat(parts[0], 10);
        let selected = false;
        intervals.forEach((interval) => {
          if (interval.start < interval.end) {
            if (sliceStart >= interval.start && sliceStart < interval.end) {
              selected = true;
            }
          } else {
            if (sliceStart >= interval.start || sliceStart < interval.end) {
              selected = true;
            }
          }
        });
        if (selected) {
          slice.classList.add('selected');
        }
      });
    }

    // Clear any existing content in the SVG container.
    clock.innerHTML = '';

    // Create the rectangular slices.
    const sliceWidth = barWidth / sliceCount;
    for (let i = 0; i < sliceCount; i++) {
      const x = i * sliceWidth;
      const slice = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      slice.setAttribute('x', x);
      slice.setAttribute('y', 0);
      slice.setAttribute('width', sliceWidth);
      slice.setAttribute('height', barHeight);
      slice.classList.add('slice');
      const startHour = i / 2;
      const endHour = ((i + 1) % sliceCount) / 2;
      slice.setAttribute('data-hour', `${startHour}-${endHour}`);

      slice.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        isMouseDown = true;
        if (slice.classList.contains('selected')) {
          dragMode = 'deselect';
          slice.classList.remove('selected');
        } else {
          dragMode = 'select';
          slice.classList.add('selected');
        }
        updateTimeInput();
      });

      slice.addEventListener('pointermove', (e) => {
        if (isMouseDown) {
          let target = slice;
          if (e.pointerType !== 'mouse') {
            target = document.elementFromPoint(e.clientX, e.clientY);
            target =
              target && target.classList.contains('slice') ? target : slice;
          }
          if (dragMode === 'select') {
            target.classList.add('selected');
          } else if (dragMode === 'deselect') {
            target.classList.remove('selected');
          }
          updateTimeInput();
        }
      });

      clock.appendChild(slice);
    }

    document.addEventListener('pointerup', () => {
      isMouseDown = false;
    });

    // Create hour labels beneath the bar.
    for (let i = 0; i < segments; i++) {
      const x = i * (barWidth / segments);
      const y = barHeight + 15;
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      );
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.classList.add('label');
      text.textContent =
        i < 12
          ? i === 0
            ? '12A'
            : i + 'A'
          : i === 12
          ? '12P'
          : (i % 12) + 'P';
      clock.appendChild(text);
    }

    // Add vertical divider lines.
    for (let i = 0; i <= segments; i++) {
      const x = i * (barWidth / segments);
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', barHeight);
      line.classList.add('divider');
      clock.appendChild(line);
    }

    // Add top and bottom border lines.
    const topLine = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    topLine.setAttribute('x1', 0);
    topLine.setAttribute('y1', 0);
    topLine.setAttribute('x2', barWidth);
    topLine.setAttribute('y2', 0);
    topLine.classList.add('divider');
    clock.appendChild(topLine);

    const bottomLine = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    bottomLine.setAttribute('x1', 0);
    bottomLine.setAttribute('y1', barHeight);
    bottomLine.setAttribute('x2', barWidth);
    bottomLine.setAttribute('y2', barHeight);
    bottomLine.classList.add('divider');
    clock.appendChild(bottomLine);

    // Optionally, initialize based on the input value.
    updateWheelFromInput();
  });
});
