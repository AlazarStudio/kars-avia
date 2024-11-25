import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'

import HotelAbout_tabComponent from '../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent'
import HotelCompany_tabComponent from '../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent'
import HotelNomerFond_tabComponent from '../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent'
import HotelShahmatka_tabComponent from '../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent'
import HotelTarifs_tabComponent from '../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent'

import classes from './SDAdminHotelContent.module.css'

const SDAdminHotelContent = ({ id, user, selectedTab, handleTabSelect }) => (
	<Tabs
		className={classes.tabs}
		selectedIndex={selectedTab}
		onSelect={handleTabSelect}
	>
		<TabList className={classes.tabList}>
			<Tab className={classes.tab}>Шахматка</Tab>
			<Tab className={classes.tab}>Цены</Tab>
			<Tab className={classes.tab}>Номерной фонд</Tab>
			<Tab className={classes.tab}>Компания</Tab>
			<Tab className={classes.tab}>О гостинице</Tab>
		</TabList>

		<TabPanel className={classes.tabPanel}>
			<HotelShahmatka_tabComponent id={id} />
		</TabPanel>

		<TabPanel className={classes.tabPanel}>
			<HotelTarifs_tabComponent id={id} user={user} />
		</TabPanel>

		<TabPanel className={classes.tabPanel}>
			<HotelNomerFond_tabComponent id={id} />
		</TabPanel>

		<TabPanel className={classes.tabPanel}>
			<HotelCompany_tabComponent id={id} />
		</TabPanel>

		<TabPanel className={classes.tabPanel}>
			<HotelAbout_tabComponent id={id} />
		</TabPanel>
	</Tabs>
)

export default SDAdminHotelContent
