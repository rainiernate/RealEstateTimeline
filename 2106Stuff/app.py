import streamlit as st
import pandas as pd
import sqlite3

# Must be first Streamlit command
st.set_page_config(layout="wide")

st.title('Property Items Summary')


# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('property_items.db')
    c = conn.cursor()

    # Create tables if they don't exist
    c.execute('''CREATE TABLE IF NOT EXISTS staying_items
                 (Item TEXT, Status TEXT, Notes TEXT)''')

    c.execute('''CREATE TABLE IF NOT EXISTS priced_items
                 (Item TEXT, Price REAL, Notes TEXT)''')

    c.execute('''CREATE TABLE IF NOT EXISTS sold_items
                 (Item TEXT, Price REAL, Notes TEXT)''')

    # Insert default data if tables are empty
    c.execute("SELECT COUNT(*) FROM staying_items")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO staying_items VALUES (?,?,?)", [
            ('Hot Tub', 'Confirmed', ''),
            ('Hot Tub Corner Cabinet', 'Confirmed', ''),
            ('Side Yard BBQ Awning', 'Confirmed', ''),
            ('Kitchen Refrigerator', 'Confirmed', ''),
            ('Metal Racking (Garage)', '**Need to Confirm**', ''),
            ('Fixed shelves on wall', '**Need to Confirm**', ''),
            ('Clock above fireplace', '**Need to Confirm**', ''),
            ('Guest room queen bed (Free if wanted)', '**Need to Confirm if Wanted**', 'Includes boxspring and frame')
        ])

    c.execute("SELECT COUNT(*) FROM priced_items")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO priced_items VALUES (?,?,?)", [
            ('Back porch cabinet below TV', 100.00, ''),
            ('Hot Tub TV', 100.00, ''),
            ('Outdoor Patio Sitting Furniture', 250.00, ''),
            ('Shop TV', 100.00, ''),
            ('Washer and Dryer', 850.00, ''),
            ('Living Room Couch', 1500.00, ''),
            ('Living Room TV', 1500.00, ''),
            ('White Storage Cabinets w/mirrors', 100.00, ''),
            ('Sauna', 2000.00, ''),
            ('Garage Freezer', 100.00, ''),
            ('Gym Equipment w/flooring', 850.00, ''),
            ('Large Blue Planter Pots by Pond (Negotiable)', 100.00, ''),
            ('2 Blue Planter Pots by Garage Doors (Negotiable)', 50.00, '')
        ])

    c.execute("SELECT COUNT(*) FROM sold_items")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO sold_items VALUES (?,?,?)", [
            ('Generator', 500.00, 'Sold 11/10'),
            ('Wicker Furniture', 300.00, 'Sold 11/9')
        ])

    conn.commit()
    conn.close()


# Load data from SQLite
def load_data():
    conn = sqlite3.connect('property_items.db')
    staying = pd.read_sql_query("SELECT * FROM staying_items", conn)
    priced = pd.read_sql_query("SELECT * FROM priced_items", conn)
    sold = pd.read_sql_query("SELECT * FROM sold_items", conn)
    conn.close()
    return staying, priced, sold


# Save data to SQLite
def save_data(table_name, df):
    conn = sqlite3.connect('property_items.db')
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    conn.close()


# Initialize database and load data
if 'initialized' not in st.session_state:
    init_db()
    st.session_state.initialized = True

# Load data
staying_df, priced_df, sold_df = load_data()

# Items Staying with House
st.header('Items Staying with House')
edited_staying = st.data_editor(
    staying_df,
    key='staying_items',
    disabled=['Item', 'Status'],
    use_container_width=True,
    on_change=lambda: save_data('staying_items', st.session_state.staying_items)
)

# Items for Sale
st.header('Items for Sale')
edited_priced = st.data_editor(
    priced_df,
    key='priced_items',
    disabled=['Item', 'Price'],
    use_container_width=True,
    on_change=lambda: save_data('priced_items', st.session_state.priced_items)
)

# Items Already Sold
st.header('Items Sold')
edited_sold = st.data_editor(
    sold_df,
    key='sold_items',
    disabled=['Item', 'Price'],
    use_container_width=True,
    on_change=lambda: save_data('sold_items', st.session_state.sold_items)
)

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