import streamlit as st
import pandas as pd
import os

# Must be first Streamlit command
st.set_page_config(layout="wide")

st.title('Property Items Summary')

# Define file paths
DATA_DIR = "data"
STAYING_ITEMS_FILE = os.path.join(DATA_DIR, "staying_items.csv")
PRICED_ITEMS_FILE = os.path.join(DATA_DIR, "priced_items.csv")
SOLD_ITEMS_FILE = os.path.join(DATA_DIR, "sold_items.csv")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)


# Initialize default data
def get_default_staying_items():
    return pd.DataFrame({
        'Item': ['Hot Tub', 'Hot Tub Corner Cabinet', 'Side Yard BBQ Awning',
                 'Kitchen Refrigerator', 'Metal Racking (Garage)',
                 'Fixed shelves on wall', 'Clock above fireplace',
                 'Guest room queen bed (Free if wanted)'],
        'Status': ['Confirmed', 'Confirmed', 'Confirmed', 'Confirmed',
                   '**Need to Confirm**', '**Need to Confirm**', '**Need to Confirm**',
                   '**Need to Confirm if Wanted**'],
        'Notes': ['', '', '', '', '', '', '', 'Includes boxspring and frame']
    })


def get_default_priced_items():
    return pd.DataFrame({
        'Item': ['Back porch cabinet below TV', 'Hot Tub TV',
                 'Outdoor Patio Sitting Furniture', 'Shop TV',
                 'Washer and Dryer', 'Living Room Couch', 'Living Room TV',
                 'White Storage Cabinets w/mirrors', 'Sauna',
                 'Garage Freezer', 'Gym Equipment w/flooring',
                 'Large Blue Planter Pots by Pond (Negotiable)',
                 '2 Blue Planter Pots by Garage Doors (Negotiable)'],
        'Price': [100.00, 100.00, 250.00, 100.00, 850.00, 1500.00, 1500.00,
                  100.00, 2000.00, 100.00, 850.00, 100.00, 50.00],
        'Notes': [''] * 13
    })


def get_default_sold_items():
    return pd.DataFrame({
        'Item': ['Generator', 'Wicker Furniture'],
        'Price': [500.00, 300.00],
        'Notes': ['Sold 11/10', 'Sold 11/9']
    })


# Load data from CSV files or create with defaults
def load_data():
    try:
        staying_items = pd.read_csv(STAYING_ITEMS_FILE)
    except FileNotFoundError:
        staying_items = get_default_staying_items()
        staying_items.to_csv(STAYING_ITEMS_FILE, index=False)

    try:
        priced_items = pd.read_csv(PRICED_ITEMS_FILE)
    except FileNotFoundError:
        priced_items = get_default_priced_items()
        priced_items.to_csv(PRICED_ITEMS_FILE, index=False)

    try:
        sold_items = pd.read_csv(SOLD_ITEMS_FILE)
    except FileNotFoundError:
        sold_items = get_default_sold_items()
        sold_items.to_csv(SOLD_ITEMS_FILE, index=False)

    return staying_items, priced_items, sold_items


# Save data to CSV files
def save_data(staying_items, priced_items, sold_items):
    staying_items.to_csv(STAYING_ITEMS_FILE, index=False)
    priced_items.to_csv(PRICED_ITEMS_FILE, index=False)
    sold_items.to_csv(SOLD_ITEMS_FILE, index=False)


# Initialize session state with data from files
if 'data_loaded' not in st.session_state:
    staying_items, priced_items, sold_items = load_data()
    st.session_state['staying_items'] = staying_items
    st.session_state['priced_items'] = priced_items
    st.session_state['sold_items'] = sold_items
    st.session_state['data_loaded'] = True

# Items Staying with House
st.header('Items Staying with House')
edited_staying = st.data_editor(
    st.session_state.staying_items,
    num_rows="dynamic",
    use_container_width=True,
    column_config={
        "Item": st.column_config.Column("Item", width="large"),
        "Status": st.column_config.Column("Status", width="medium"),
        "Notes": st.column_config.TextColumn("Notes", width="large")
    }
)

# Items for Sale (Combined Fixed and Negotiable)
st.header('Items for Sale')
edited_priced = st.data_editor(
    st.session_state.priced_items,
    num_rows="dynamic",
    height=600,
    use_container_width=True,
    column_config={
        "Item": st.column_config.Column("Item", width="large"),
        "Price": st.column_config.NumberColumn(
            "Price",
            format="$%.2f",
            width="medium"
        ),
        "Notes": st.column_config.TextColumn("Notes", width="large")
    }
)

# Items Already Sold
st.header('Items Sold')
edited_sold = st.data_editor(
    st.session_state.sold_items,
    num_rows="dynamic",
    use_container_width=True,
    column_config={
        "Item": st.column_config.Column("Item", width="large"),
        "Price": st.column_config.NumberColumn(
            "Price",
            format="$%.2f",
            width="medium"
        ),
        "Notes": st.column_config.TextColumn("Notes", width="large")
    }
)

# Save changes to session state and CSV files
if (edited_staying is not st.session_state.staying_items or
        edited_priced is not st.session_state.priced_items or
        edited_sold is not st.session_state.sold_items):
    st.session_state.staying_items = edited_staying
    st.session_state.priced_items = edited_priced
    st.session_state.sold_items = edited_sold

    save_data(edited_staying, edited_priced, edited_sold)

st.markdown('*Note: Seller has offered to bundle items together for a flat price rather than price individually.*')

# Direct download button without secondary confirmation
csv_data = pd.concat([
    edited_staying.assign(Section='Staying with House'),
    edited_priced.assign(Section='For Sale'),
    edited_sold.assign(Section='Sold')
]).to_csv(index=False).encode('utf-8')

st.download_button(
    "Download Complete Inventory",
    csv_data,
    "property_items.csv",
    "text/csv"
)