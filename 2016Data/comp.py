import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="Real Estate Analysis", layout="wide")


@st.cache_data
def load_style_data():
    df = pd.read_csv("Sold And StatsRamblerTwoStory.csv")
    df['Selling Price'] = pd.to_numeric(df['Selling Price'].replace(',', '', regex=True), errors='coerce')
    df['Square Footage'] = pd.to_numeric(df['Square Footage'].replace(',', '', regex=True), errors='coerce')
    df['Listing Number'] = df['Listing Number'].astype(str).replace(',', '', regex=True)
    df['Price/SqFt'] = df['Selling Price'] / df['Square Footage']
    return df


@st.cache_data
def load_district_data():
    df_dieringer = pd.read_csv("Sold And StatsSchool-Dieringer.csv")  # Dieringer data
    df_sumner = pd.read_csv("Sold And Stats-Sumner.csv")  # Sumner data

    def convert_price(value):
        if pd.isna(value):
            return np.nan
        if isinstance(value, str):
            return float(value.replace(',', '').replace('$', ''))
        return float(value)

    def convert_sqft(value):
        if pd.isna(value):
            return np.nan
        if isinstance(value, str):
            return float(value.replace(',', ''))
        return float(value)

    for df in [df_dieringer, df_sumner]:
        df['Selling Price'] = df['Selling Price'].apply(convert_price)
        df['Square Footage'] = df['Square Footage'].apply(convert_sqft)
        df['Price_per_SqFt'] = df['Selling Price'] / df['Square Footage']

    df_dieringer['District'] = 'Dieringer'
    df_sumner['District'] = 'Sumner-Bonney Lake'

    return pd.concat([df_sumner, df_dieringer], ignore_index=True)


def show_style_analysis(df):
    st.title("Bonney Lake Real Estate Analysis: Rambler vs 2-Story Homes")

    with st.expander("📋 Data Collection Criteria", expanded=True):
        st.markdown("""
        ### Search Parameters Used:
        - **Square Footage:** 1,800 - 2,200 sq ft
        - **Time Frame:** Sold within last 720 days
        - **Location:** Bonney Lake (98391)
        - **Home Types:** Single Story (Rambler) and Two Story homes only
        """)

    st.warning("""
        📢 **Important Note:** This analysis represents typical rambler vs 2-story sales in the area. 
        Premium or luxury properties may command different premiums than shown here.
    """)

    one_story = df[df['Style Code'] == '10 - 1 Story']
    two_story = df[df['Style Code'] == '12 - 2 Story']

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Number of Ramblers", f"{len(one_story)}")
        st.metric("Number of 2-Story", f"{len(two_story)}")
    with col2:
        st.metric("Avg Rambler Price", f"${one_story['Selling Price'].mean():,.0f}")
        st.metric("Avg 2-Story Price", f"${two_story['Selling Price'].mean():,.0f}")
    with col3:
        rambler_price_sqft = one_story['Price/SqFt'].mean()
        two_story_price_sqft = two_story['Price/SqFt'].mean()
        premium = ((rambler_price_sqft - two_story_price_sqft) / two_story_price_sqft) * 100
        st.metric("Avg Rambler $/SqFt", f"${rambler_price_sqft:.2f}")
        st.metric("Avg 2-Story $/SqFt", f"${two_story_price_sqft:.2f}")
        st.metric("Rambler Premium", f"{premium:.1f}%")

    col1, col2 = st.columns(2)
    with col1:
        fig_price = go.Figure()
        fig_price.add_trace(go.Box(y=one_story['Selling Price'], name='Ramblers',
                                   customdata=one_story['Listing Number'],
                                   hovertemplate="MLS #: %{customdata}<br>Price: $%{y:,.0f}"))
        fig_price.add_trace(go.Box(y=two_story['Selling Price'], name='2-Story',
                                   customdata=two_story['Listing Number'],
                                   hovertemplate="MLS #: %{customdata}<br>Price: $%{y:,.0f}"))
        fig_price.update_layout(title='Price Distribution by Home Type', yaxis_title='Selling Price ($)')
        st.plotly_chart(fig_price, use_container_width=True)

    with col2:
        fig_ppsf = go.Figure()
        fig_ppsf.add_trace(go.Box(y=one_story['Price/SqFt'], name='Ramblers',
                                  customdata=one_story['Listing Number'],
                                  hovertemplate="MLS #: %{customdata}<br>$/SqFt: $%{y:.2f}"))
        fig_ppsf.add_trace(go.Box(y=two_story['Price/SqFt'], name='2-Story',
                                  customdata=two_story['Listing Number'],
                                  hovertemplate="MLS #: %{customdata}<br>$/SqFt: $%{y:.2f}"))
        fig_ppsf.update_layout(title='Price per SqFt Distribution', yaxis_title='Price per Square Foot ($)')
        st.plotly_chart(fig_ppsf, use_container_width=True)

    filtered_df = df[df['Style Code'].isin(['10 - 1 Story', '12 - 2 Story'])]
    fig_scatter = px.scatter(filtered_df, x='Square Footage', y='Selling Price',
                             color='Style Code', title='Price vs Square Footage',
                             hover_data={'Listing Number': True, 'Selling Price': ':$,.0f',
                                         'Square Footage': ':,.0f', 'Style Code': True})
    st.plotly_chart(fig_scatter, use_container_width=True)

    st.subheader("Raw Data")
    df_display = filtered_df.sort_values('Selling Price', ascending=False)
    st.dataframe(df_display)
    csv = filtered_df.to_csv(index=False)
    st.download_button("Download Data as CSV", csv, "style_analysis.csv", "text/csv")


def show_district_analysis(df):
    st.title("School District Housing Price Comparison")


    with st.expander("📋 Data Collection Criteria", expanded=True):
        st.markdown("""
        ### Search Parameters Used:
        - **Square Footage:** 2,000 - 3,000 sq ft
        - **Time Frame:** Sold within last 720 days
        - **Location:** Sumner-Bonney Lake School District or Dieringer School District
        """)

        #comment

    st.warning("""
        📢 **Important Note:** This analysis represents typical home sales in the area. 
        Premium or luxury properties may command different premiums than shown here. 
    """)

    dieringer_data = df[df['District'] == 'Dieringer']
    sumner_data = df[df['District'] == 'Sumner-Bonney Lake']

    col1, col2, col3 = st.columns(3)
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

    col1, col2 = st.columns(2)
    with col1:
        fig_box = go.Figure()
        fig_box.add_trace(go.Box(y=df[df['District'] == 'Dieringer']['Selling Price'],
                                 name='Dieringer',
                                 customdata=df[df['District'] == 'Dieringer']['Listing Number'],
                                 hovertemplate="MLS #: %{customdata}<br>Price: $%{y:,.0f}"))
        fig_box.add_trace(go.Box(y=df[df['District'] == 'Sumner-Bonney Lake']['Selling Price'],
                                 name='Sumner-Bonney Lake',
                                 customdata=df[df['District'] == 'Sumner-Bonney Lake']['Listing Number'],
                                 hovertemplate="MLS #: %{customdata}<br>Price: $%{y:,.0f}"))
        fig_box.update_layout(title='Price Distribution by District', yaxis_title='Selling Price ($)')
        st.plotly_chart(fig_box, use_container_width=True)

    with col2:
        fig_ppsf = go.Figure()
        fig_ppsf.add_trace(go.Box(y=df[df['District'] == 'Dieringer']['Price_per_SqFt'],
                                  name='Dieringer',
                                  customdata=df[df['District'] == 'Dieringer']['Listing Number'],
                                  hovertemplate="MLS #: %{customdata}<br>$/SqFt: $%{y:.2f}"))
        fig_ppsf.add_trace(go.Box(y=df[df['District'] == 'Sumner-Bonney Lake']['Price_per_SqFt'],
                                  name='Sumner-Bonney Lake',
                                  customdata=df[df['District'] == 'Sumner-Bonney Lake']['Listing Number'],
                                  hovertemplate="MLS #: %{customdata}<br>$/SqFt: $%{y:.2f}"))
        fig_ppsf.update_layout(title='Price per SqFt Distribution', yaxis_title='Price per Square Foot ($)')
        st.plotly_chart(fig_ppsf, use_container_width=True)

    fig_scatter = px.scatter(df, x='Square Footage', y='Selling Price',
                             color='District', title='Price vs Square Footage',
                             hover_data={'Listing Number': True, 'Selling Price': ':$,.0f',
                                         'Square Footage': ':,.0f', 'District': True})
    st.plotly_chart(fig_scatter, use_container_width=True)

    st.subheader("Raw Data")
    df_display = df.sort_values('Selling Price', ascending=False)
    st.dataframe(df_display)
    csv = df.to_csv(index=False)
    st.download_button("Download Data as CSV", csv, "district_comparison.csv", "text/csv")



def main():
    tab1, tab2 = st.tabs(["Home Style Analysis", "School District Comparison"])

    with tab1:
        show_style_analysis(load_style_data())
    with tab2:
        show_district_analysis(load_district_data())


if __name__ == "__main__":
    main()