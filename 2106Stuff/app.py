import streamlit as st
import pandas as pd

# Must be first Streamlit command
st.set_page_config(layout="wide")

st.title('Property Items Summary')

# Currency formatting function
def format_currency(value):
    if pd.isna(value) or value == '':
        return ''
    try:
        return f"${value:,.2f}"
    except:
        return value

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

# Initialize session state
if 'staying_items' not in st.session_state:
    st.session_state['staying_items'] = get_default_staying_items()
if 'priced_items' not in st.session_state:
    st.session_state['priced_items'] = get_default_priced_items()
if 'sold_items' not in st.session_state:
    st.session_state['sold_items'] = get_default_sold_items()

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

# Save changes to session state
st.session_state.staying_items = edited_staying
st.session_state.priced_items = edited_priced
st.session_state.sold_items = edited_sold

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