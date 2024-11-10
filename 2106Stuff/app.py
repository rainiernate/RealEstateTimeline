import streamlit as st
import pandas as pd
import os

# Must be first Streamlit command
st.set_page_config(layout="wide")

st.title('Property Items Summary')

# Create data directory if it doesn't exist
if not os.path.exists('data'):
    os.makedirs('data')


# Load data function
def load_data():
    try:
        staying = pd.read_csv('data/staying.csv')
    except FileNotFoundError:
        staying = pd.DataFrame({
            'Item': ['Hot Tub', 'Hot Tub Corner Cabinet', 'Side Yard BBQ Awning',
                     'Kitchen Refrigerator', 'Metal Racking (Garage)',
                     'Fixed shelves on wall', 'Clock above fireplace',
                     'Guest room queen bed (Free if wanted)'],
            'Status': ['Confirmed', 'Confirmed', 'Confirmed', 'Confirmed',
                       '**Need to Confirm**', '**Need to Confirm**', '**Need to Confirm**',
                       '**Need to Confirm if Wanted**'],
            'Notes': [''] * 8
        })
        staying.to_csv('data/staying.csv', index=False)

    try:
        priced = pd.read_csv('data/priced.csv')
    except FileNotFoundError:
        priced = pd.DataFrame({
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
        priced.to_csv('data/priced.csv', index=False)

    try:
        sold = pd.read_csv('data/sold.csv')
    except FileNotFoundError:
        sold = pd.DataFrame({
            'Item': ['Generator', 'Wicker Furniture'],
            'Price': [500.00, 300.00],
            'Notes': ['Sold 11/10', 'Sold 11/9']
        })
        sold.to_csv('data/sold.csv', index=False)

    return staying, priced, sold


# Load initial data
if 'initialized' not in st.session_state:
    staying_df, priced_df, sold_df = load_data()
    st.session_state.staying_df = staying_df
    st.session_state.priced_df = priced_df
    st.session_state.sold_df = sold_df
    st.session_state.initialized = True

# Items Staying with House
st.header('Items Staying with House')
edited_staying = st.data_editor(
    st.session_state.staying_df,
    key='staying_items',
    disabled=['Item', 'Status'],
    use_container_width=True
)

# Items for Sale
st.header('Items for Sale')
edited_priced = st.data_editor(
    st.session_state.priced_df,
    key='priced_items',
    disabled=['Item', 'Price'],
    use_container_width=True
)

# Items Already Sold
st.header('Items Sold')
edited_sold = st.data_editor(
    st.session_state.sold_df,
    key='sold_items',
    disabled=['Item', 'Price'],
    use_container_width=True
)

# Save button
if st.button('Save Changes'):
    edited_staying.to_csv('data/staying.csv', index=False)
    edited_priced.to_csv('data/priced.csv', index=False)
    edited_sold.to_csv('data/sold.csv', index=False)
    st.success('Changes saved!')

st.markdown('*Note: Seller has offered to bundle items together for a flat price rather than price individually.*')

# Download current state
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