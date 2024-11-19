import streamlit as st
from datetime import date, timedelta, datetime
from dataclasses import dataclass
from typing import Optional, List, Dict
from zoneinfo import ZoneInfo
from enum import Enum

def format_date(d: date, include_time: bool = True) -> str:
    """Format date for display with optional time."""
    if not isinstance(d, (date, datetime)):
        return "Invalid Date"
    base_str = d.strftime("%B %d, %Y")
    return f"{base_str} at 9:00 PM" if include_time else base_str

def init_session_state():
    """Initialize session state variables."""
    if 'contingencies' not in st.session_state:
        st.session_state.contingencies = []

def show_date_calculation_details(start_date: date, end_date: date, days: int,
                                is_business_days: bool = False) -> str:
    """Format the detailed calculation of days between dates."""
    if is_business_days:
        business_days = len([d for d in (start_date + timedelta(n)
                           for n in range((end_date - start_date).days + 1))
                           if HolidayUtils.is_business_day(d)])
        return f"{days} business days ({(end_date - start_date).days} calendar days)"
    return f"{days} calendar days"


class TimingType(Enum):
    """Enumeration of timing methods for contingencies."""
    FIXED_DATE = "fixed_date"
    DAYS_FROM_MUTUAL = "days_from_mutual"
    DAYS_BEFORE_CLOSING = "days_before_closing"

    @classmethod
    def friendly_name(cls, timing_type: str) -> str:
        """Converts enum value to a human-friendly format."""
        return timing_type.replace('_', ' ').title()



@dataclass
class Contingency:
    """Represents a contingency with its details and constraints."""
    name: str
    timing_type: TimingType
    days: Optional[int] = None
    fixed_date: Optional[date] = None
    description: Optional[str] = None
    is_possession_date: bool = False

    def is_valid(self) -> bool:
        """Validates the contingency configuration."""
        if self.timing_type == TimingType.FIXED_DATE:
            return self.fixed_date is not None  # Only need fixed_date for FIXED_DATE type
        return self.days is not None and self.days > 0  # Only need days for other types


class HolidayUtils:
    """Utility class for WA State holiday calculations."""

    @staticmethod
    def get_wa_state_holidays(year: int) -> List[date]:
        """Returns WA State holidays for the given year."""
        holidays = [
            date(year, 1, 1),  # New Year's Day
            date(year, 6, 19),  # Juneteenth
            date(year, 7, 4),  # Independence Day
            date(year, 11, 11),  # Veterans Day
            date(year, 12, 25)  # Christmas
        ]
        holidays += [
            HolidayUtils.nth_weekday_of_month(year, 1, 0, 3),  # MLK Day
            HolidayUtils.nth_weekday_of_month(year, 2, 0, 3),  # Presidents' Day
            HolidayUtils.last_weekday_of_month(year, 5, 0),  # Memorial Day
            HolidayUtils.nth_weekday_of_month(year, 9, 0, 1),  # Labor Day
            HolidayUtils.nth_weekday_of_month(year, 11, 3, 4)  # Thanksgiving
        ]
        return [HolidayUtils.adjust_weekend_holiday(h) for h in holidays]

    @staticmethod
    def nth_weekday_of_month(year: int, month: int, weekday: int, nth: int) -> date:
        """Returns the nth occurrence of a weekday in a given month."""
        first_day = date(year, month, 1)
        offset = (weekday - first_day.weekday()) % 7
        return first_day + timedelta(days=offset + (nth - 1) * 7)

    @staticmethod
    def last_weekday_of_month(year: int, month: int, weekday: int) -> date:
        """Returns the last occurrence of a weekday in a given month."""
        next_month = date(year, month + 1, 1) if month < 12 else date(year + 1, 1, 1)
        last_day = next_month - timedelta(days=1)
        offset = (weekday - last_day.weekday()) % 7
        return last_day - timedelta(days=(7 - offset) if offset else 0)

    @staticmethod
    def adjust_weekend_holiday(holiday: date) -> date:
        """Adjusts holidays falling on weekends to nearest weekday."""
        if holiday.weekday() == 5:  # Saturday
            return holiday - timedelta(days=1)
        elif holiday.weekday() == 6:  # Sunday
            return holiday + timedelta(days=1)
        return holiday

    @staticmethod
    def is_business_day(day: date) -> bool:
        """Determines if a date is a business day."""
        return day.weekday() < 5 and day not in HolidayUtils.get_wa_state_holidays(day.year)


class DateCalculator:
    """Performs date calculations based on WA State rules."""

    @staticmethod
    def calculate_business_days(base_date: date, days: int, forward: bool) -> date:
        """Calculates a date offset by business days."""
        st.write(f"\n📅 Business Days Calculation:")
        st.write(f"• Starting from: {base_date}")
        st.write(f"• Direction: {'Forward' if forward else 'Backward'}")
        st.write(f"• Days to count: {days}")

        current_date = base_date + timedelta(days=1 if forward else -1)
        days_counted = 0

        st.write("\nDay-by-Day Count:")
        while days_counted < days:
            is_weekend = current_date.weekday() >= 5
            is_holiday = current_date in HolidayUtils.get_wa_state_holidays(current_date.year)

            if is_weekend or is_holiday:
                reason = "Weekend" if is_weekend else "Holiday"
                st.write(f"❌ {current_date.strftime('%A, %B %d')}: Skipped ({reason})")
            else:
                days_counted += 1
                st.write(f"✓ {current_date.strftime('%A, %B %d')}: Business Day {days_counted}")

            if days_counted < days:
                current_date += timedelta(days=1 if forward else -1)

        st.write(f"\n🎯 Final Date: {current_date}")
        return current_date

    @staticmethod
    @staticmethod
    def calculate_calendar_days(base_date: date, days: int, forward: bool) -> date:
        """Calculates a date offset by calendar days."""
        st.write(f"\n📅 Calendar Days Calculation:")
        st.write(f"• Starting from: {base_date}")
        st.write(f"• Direction: {'Forward' if forward else 'Backward'}")
        st.write(f"• Days to count: {days}")

        start_date = base_date + timedelta(days=1 if forward else -1)
        remaining_days = days - 1
        final_date = start_date + timedelta(days=remaining_days if forward else -remaining_days)

        # Show the day-by-day progression
        st.write("\nDay-by-Day Count:")
        current = start_date
        day_count = 1
        while day_count <= days:
            is_weekend = current.weekday() >= 5
            is_holiday = current in HolidayUtils.get_wa_state_holidays(current.year)

            status = "Weekend" if is_weekend else "Holiday" if is_holiday else "Regular Day"
            st.write(f"Day {day_count}: {current.strftime('%A, %B %d')} ({status})")

            if day_count < days:
                current += timedelta(days=1 if forward else -1)
            day_count += 1

        st.write(f"\n🎯 Final Date: {final_date}")
        return final_date

class TimelineCalculator:
    def __init__(self, mutual_date: date, closing_date: date):
        if mutual_date >= closing_date:
            raise ValueError("Closing date must be after mutual acceptance date.")
        self.mutual_date = mutual_date
        self.closing_date = closing_date

    def calculate_date(self, contingency: Contingency) -> Optional[date]:
        """Determines the effective date for a contingency."""
        st.write(f"\n🔍 Processing: {contingency.name}")
        st.write(f"Type: {contingency.timing_type.value}")

        # Handle fixed dates first and return immediately
        if contingency.timing_type == TimingType.FIXED_DATE:
            st.write("Using fixed date")
            if contingency.fixed_date is None:
                raise ValueError("Fixed date must be set for fixed_date timing type")
            return contingency.fixed_date

        # For non-fixed dates, ensure we have days value
        if contingency.days is None:
            raise ValueError(f"'days' must be set for timing type {contingency.timing_type.value}")

        st.write(f"Days: {contingency.days}")

        # Rest of calculation for non-fixed dates
        is_from_mutual = contingency.timing_type.value == TimingType.DAYS_FROM_MUTUAL.value
        base_date = self.mutual_date if is_from_mutual else self.closing_date
        forward = is_from_mutual

        if contingency.days <= 5 and not contingency.is_possession_date:
            return DateCalculator.calculate_business_days(
                base_date=base_date,
                days=contingency.days,
                forward=forward
            )
        else:
            return DateCalculator.calculate_calendar_days(
                base_date=base_date,
                days=contingency.days,
                forward=forward
            )

def render_contingency_form(mutual_date: date, closing_date: date):
    """Renders a form for adding new contingencies."""
    # Timing type selector outside form for immediate updates
    timing_type = st.selectbox(
        "Timing Method",
        options=[t.value for t in TimingType],
        format_func=TimingType.friendly_name,
        key="timing_type_selector"
    )

    with st.form("new_contingency_form"):
        name = st.text_input("Contingency Name", placeholder="Enter contingency name")

        col1, col2 = st.columns(2)

        with col1:
            if timing_type == TimingType.FIXED_DATE.value:
                fixed_date = st.date_input(
                    "Fixed Date",
                    min_value=mutual_date,
                    max_value=closing_date
                )
                days = None  # Explicitly set days to None for fixed dates
                st.caption(f"Must be between {mutual_date.strftime('%m/%d/%Y')} "
                           f"and {closing_date.strftime('%m/%d/%Y')}")
            else:
                fixed_date = None
                days = st.number_input("Number of Days", min_value=1, value=1)
                if days <= 5:
                    st.caption("✓ Using business days (excludes weekends/holidays)")
                else:
                    st.caption("✓ Using calendar days")

        with col2:
            description = st.text_area(
                "Description (optional)",
                placeholder="Enter additional details",
                height=100
            )
            is_possession = st.checkbox("Is Possession Date?")

        submitted = st.form_submit_button("Add Contingency")

        if submitted:
            if not name.strip():
                st.error("Contingency name is required.")
                return

            new_contingency = Contingency(
                name=name.strip(),
                timing_type=TimingType(timing_type),
                days=days,
                fixed_date=fixed_date,
                description=description.strip() if description else None,
                is_possession_date=is_possession
            )

            if new_contingency.is_valid():
                st.session_state.contingencies.append(new_contingency)
                st.success(f"Added contingency: {name}")
                # Generate timeline immediately
                render_timeline(mutual_date, closing_date)
                st.rerun()
            else:
                st.error("Invalid contingency configuration.")


def render_timeline(mutual_date: date, closing_date: date):
    """Render the calculated timeline with detailed information."""
    try:
        calculator = TimelineCalculator(mutual_date, closing_date)
        timeline = []

        # Add mutual acceptance
        timeline.append({
            "Event": "Mutual Acceptance",
            "Date": format_date(mutual_date),
            "Days from Mutual": "0",
            "Form Input": "-",
            "Calendar Days": "-",
            "Calculation Method": "-"
        })

        # Process contingencies
        for contingency in st.session_state.contingencies:
            if contingency.is_valid():
                calculated_date = calculator.calculate_date(contingency)
                if calculated_date:
                    calendar_days = (calculated_date - mutual_date).days

                    # Handle form input display based on timing type
                    if contingency.timing_type == TimingType.FIXED_DATE:
                        form_input = "Fixed Date"
                    else:
                        form_input = (f"{contingency.days} days " +
                                      ("from mutual" if contingency.timing_type == TimingType.DAYS_FROM_MUTUAL else
                                       "before closing"))

                    # Handle calculation method display based on timing type
                    if contingency.timing_type == TimingType.FIXED_DATE:
                        calculation_method = "Fixed Date"
                    else:
                        calculation_method = (
                            "Business Days" if contingency.days <= 5 and not contingency.is_possession_date
                            else "Calendar Days"
                        )

                    timeline.append({
                        "Event": contingency.name,
                        "Date": format_date(calculated_date),
                        "Days from Mutual": f"+{calendar_days}",
                        "Form Input": form_input,
                        "Calendar Days": f"{calendar_days} days",
                        "Calculation Method": calculation_method
                    })

        # Add closing
        closing_days = (closing_date - mutual_date).days
        timeline.append({
            "Event": "Closing",
            "Date": format_date(closing_date),
            "Days from Mutual": f"+{closing_days}",
            "Form Input": "-",
            "Calendar Days": f"{closing_days} days",
            "Calculation Method": "-"
        })

        # Sort by days from mutual
        sorted_timeline = ([timeline[0]] +
                           sorted(timeline[1:-1],
                                  key=lambda x: int(x["Days from Mutual"].replace("+", ""))) +
                           [timeline[-1]])

        # Display as table
        st.table(sorted_timeline)

    except ValueError as e:
        st.error(str(e))
    except Exception as e:
        st.error(f"An error occurred while calculating the timeline: {str(e)}")

def main():
    st.title("Real Estate Timeline Calculator")
    init_session_state()

    col1, col2 = st.columns(2)
    with col1:
        mutual_date = st.date_input("Mutual Acceptance Date",
                                  datetime.now(ZoneInfo("America/Los_Angeles")).date())
    with col2:
        closing_date = st.date_input("Closing Date",
                                   mutual_date + timedelta(days=30))

    st.subheader("Add Contingencies")
    render_contingency_form(mutual_date, closing_date)

    # Always show timeline if there are contingencies
    if st.session_state.contingencies:
        st.subheader("Timeline")
        render_timeline(mutual_date, closing_date)

if __name__ == "__main__":
    main()
