import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.figure_factory as ff
import plotly.graph_objects as go
from datetime import datetime

st.set_page_config(page_title="School District Price Comparison", layout="wide")


@st.cache_data
def load_data():
    # Load both datasets (corrected district assignments)
    df_dieringer = pd.read_csv("Sold and Stats (1).csv")  # Dieringer data
    df_sumner = pd.read_csv("Sold and Stats (2).csv")  # Sumner data

    # Function to safely convert price columns
    def convert_price(value):
        if pd.isna(value):
            return np.nan
        if isinstance(value, str):
            return float(value.replace(',', '').replace('$', ''))
        return float(value)

    # Function to safely convert square footage
    def convert_sqft(value):
        if pd.isna(value):
            return np.nan
        if isinstance(value, str):
            return float(value.replace(',', ''))
        return float(value)

    # Process Sumner data
    df_sumner['Selling Price'] = df_sumner['Selling Price'].apply(convert_price)
    df_sumner['Square Footage'] = df_sumner['Square Footage'].apply(convert_sqft)
    df_sumner['Price_per_SqFt'] = df_sumner['Selling Price'] / df_sumner['Square Footage']
    df_sumner['District'] = 'Sumner-Bonney Lake'

    # Process Dieringer data
    df_dieringer['Selling Price'] = df_dieringer['Selling Price'].apply(convert_price)
    df_dieringer['Square Footage'] = df_dieringer['Square Footage'].apply(convert_sqft)
    df_dieringer['Price_per_SqFt'] = df_dieringer['Selling Price'] / df_dieringer['Square Footage']
    df_dieringer['District'] = 'Dieringer'

    # Combine datasets
    df = pd.concat([df_sumner, df_dieringer], ignore_index=True)

    return df


def main():
    st.title("School District Housing Price Comparison")

    # Load the data
    df = load_data()

    # Filter data by district
    dieringer_data = df[df['District'] == 'Dieringer']
    sumner_data = df[df['District'] == 'Sumner-Bonney Lake']

    # Create three columns for metrics
    col1, col2, col3 = st.columns(3)

    # Calculate and display key metrics
    with col1:
        st.metric("Number of Dieringer Homes", f"{len(dieringer_data)}")
        st.metric("Number of Sumner Homes", f"{len(sumner_data)}")

    with col2:
        st.metric("Avg Dieringer Price", f"${dieringer_data['Selling Price'].mean():,.0f}")
        st.metric("Avg Sumner Price", f"${sumner_data['Selling Price'].mean():,.0f}")

    with col3:
        dieringer_price_sqft = dieringer_data['Price_per_SqFt'].mean()
        sumner_price_sqft = sumner_data['Price_per_SqFt'].mean()
        premium = ((dieringer_price_sqft - sumner_price_sqft) / sumner_price_sqft) * 100

        st.metric("Avg Dieringer $/SqFt", f"${dieringer_price_sqft:.2f}")
        st.metric("Avg Sumner $/SqFt", f"${sumner_price_sqft:.2f}")
        st.metric("Dieringer Premium", f"{premium:.1f}%")

    # Sidebar filters
    st.sidebar.header("Filters")

    # Price range filter
    price_range = st.sidebar.slider(
        "Price Range",
        float(df['Selling Price'].min()),
        float(df['Selling Price'].max()),
        (float(df['Selling Price'].min()), float(df['Selling Price'].max()))
    )

    # Square footage range filter
    sqft_range = st.sidebar.slider(
        "Square Footage Range",
        float(df['Square Footage'].min()),
        float(df['Square Footage'].max()),
        (float(df['Square Footage'].min()), float(df['Square Footage'].max()))
    )

    # Filter the data based on selections
    filtered_df = df[
        (df['Selling Price'].between(price_range[0], price_range[1])) &
        (df['Square Footage'].between(sqft_range[0], sqft_range[1]))
        ]

    # Create two columns for the layout
    col1, col2 = st.columns(2)

    with col1:
        # Box plot of prices with Listing Number in hover data
        fig_box = go.Figure()
        fig_box.add_trace(
            go.Box(
                y=filtered_df[filtered_df['District'] == 'Dieringer']['Selling Price'],
                name='Dieringer',
                customdata=filtered_df[filtered_df['District'] == 'Dieringer']['Listing Number'],
                hovertemplate="Listing #: %{customdata}<br>Price: $%{y:,.0f}"
            )
        )
        fig_box.add_trace(
            go.Box(
                y=filtered_df[filtered_df['District'] == 'Sumner-Bonney Lake']['Selling Price'],
                name='Sumner-Bonney Lake',
                customdata=filtered_df[filtered_df['District'] == 'Sumner-Bonney Lake']['Listing Number'],
                hovertemplate="Listing #: %{customdata}<br>Price: $%{y:,.0f}"
            )
        )
        fig_box.update_layout(
            title='Price Distribution by District',
            yaxis_title='Selling Price ($)'
        )
        st.plotly_chart(fig_box, use_container_width=True)

    with col2:
        # Box plot of price per square foot with Listing Number in hover data
        fig_ppsf = go.Figure()
        fig_ppsf.add_trace(
            go.Box(
                y=filtered_df[filtered_df['District'] == 'Dieringer']['Price_per_SqFt'],
                name='Dieringer',
                customdata=filtered_df[filtered_df['District'] == 'Dieringer']['Listing Number'],
                hovertemplate="Listing #: %{customdata}<br>$/SqFt: $%{y:.2f}"
            )
        )
        fig_ppsf.add_trace(
            go.Box(
                y=filtered_df[filtered_df['District'] == 'Sumner-Bonney Lake']['Price_per_SqFt'],
                name='Sumner-Bonney Lake',
                customdata=filtered_df[filtered_df['District'] == 'Sumner-Bonney Lake']['Listing Number'],
                hovertemplate="Listing #: %{customdata}<br>$/SqFt: $%{y:.2f}"
            )
        )
        fig_ppsf.update_layout(
            title='Price per SqFt Distribution by District',
            yaxis_title='Price per Square Foot ($)'
        )
        st.plotly_chart(fig_ppsf, use_container_width=True)

    # Scatter plot with hover data
    fig_scatter = px.scatter(
        filtered_df,
        x='Square Footage',
        y='Selling Price',
        color='District',
        title='Price vs Square Footage by District',
        labels={
            'Selling Price': 'Selling Price ($)',
            'Square Footage': 'Square Footage',
            'District': 'District',
            'Listing Number': 'MLS #'
        },
        hover_data={
            'Listing Number': True,
            'Selling Price': ':$,.0f',
            'Square Footage': ':,.0f',
            'District': True
        }
    )

    # Update scatter plot hover template
    fig_scatter.update_traces(
        hovertemplate="<br>".join([
            "MLS #: %{customdata[0]}",
            "Price: %{y:$,.0f}",
            "SqFt: %{x:,.0f}",
            "District: %{customdata[3]}"
        ])
    )

    st.plotly_chart(fig_scatter, use_container_width=True)

    # Raw data section
    st.subheader("Raw Data")
    # Create a copy of the dataframe sorted by selling price
    df_display = filtered_df.sort_values('Selling Price', ascending=False)
    df_display['Listing Number'] = df_display['Listing Number'].astype(str).replace(',', '', regex=True)
    st.dataframe(df_display)

    # Download button for CSV
    csv = filtered_df.to_csv(index=False)
    st.download_button(
        label="Download Data as CSV",
        data=csv,
        file_name="school_district_comparison.csv",
        mime="text/csv"
    )


if __name__ == "__main__":
    main()